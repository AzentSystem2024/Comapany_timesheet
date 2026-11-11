import { Component, NgModule, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DxButtonModule, DxPopupModule } from 'devextreme-angular';
import notify from 'devextreme/ui/notify';
import { confirm } from 'devextreme/ui/dialog';
import { Subscription } from 'rxjs';
import { ThemeService } from 'src/app/services';
import { HolidayService, HolidayDto, SaturdayConfigDto } from './holiday.service';

export interface CalendarEvent {
  id: string;
  title: string;
  dateStr: string; // YYYY-MM-DD
  type: 'public' | 'company' | 'weekend';
  description?: string;
  repeatAnnually?: boolean;
}

export interface CalendarDay {
  date: Date;
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isSunday: boolean;
  isPermanentLeave: boolean;
  leaveLabel?: string;
  events: CalendarEvent[];
}

export interface UpcomingHolidayItem extends CalendarEvent {
  date: Date;
  dayNumber: number;
  monthStr: string;
  formattedDate: string;
  relativeLabel: string;
}

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit, OnDestroy {
  currentDate: Date = new Date();
  selectedDate: Date | null = null;
  selectedDateInfo: string = '';

  isDarkTheme: boolean = false;
  private themeSubscription?: Subscription;

  readonly weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  calendarDays: CalendarDay[] = [];
  monthYearString: string = '';
  upcomingCountText: string = '';
  upcomingHolidaysList: UpcomingHolidayItem[] = [];

  // Add / Edit Holiday Popup state
  isAdmin: boolean = false;
  isAddHolidayPopupVisible: boolean = false;
  isEditMode: boolean = false;
  editingHolidayId: number | null = null;

  // View Holiday Details Popup state (Read-Only)
  isViewHolidayPopupVisible: boolean = false;
  selectedHoliday: CalendarEvent | null = null;

  // Leave Details Popup state
  isLeaveDetailsPopupVisible: boolean = false;
  selectedLeaveDay: CalendarDay | null = null;

  // Saturday Configuration / Shift state
  saturdayConfigs: Map<string, boolean> = new Map<string, boolean>();
  isSaturdayPopupVisible: boolean = false;
  selectedSaturdayDay: CalendarDay | null = null;
  isUpdatingSaturday: boolean = false;

  newHoliday = {
    name: '',
    date: '',
    type: 'Company Holiday',
    description: '',
    repeatAnnually: true
  };

  holidayTypeOptions: string[] = [
    'Company Holiday',
    'Public Holiday'
  ];

  // Holiday data (loaded from backend API)
  allEvents: CalendarEvent[] = [];
  private loadedYear: number | null = null;

  constructor(
    private themeService: ThemeService,
    private holidayService: HolidayService
  ) {}

  ngOnInit(): void {
    this.checkAdminStatus();
    this.isDarkTheme = this.themeService.currentTheme === 'dark';
    this.themeSubscription = this.themeService.isDark.subscribe(isDark => {
      this.isDarkTheme = isDark;
    });
    this.loadDataForYear(this.currentDate.getFullYear());
  }

  loadDataForYear(year: number): void {
    this.loadHolidaysForYear(year);
    this.loadSaturdayConfigsForYear(year);
  }

  private checkAdminStatus(): void {
    try {
      const logDataStr = localStorage.getItem('logData') || sessionStorage.getItem('logData') || '{}';
      const logData = JSON.parse(logDataStr);
      const logUserRole = String(logData.UserRoleName || logData.userRoleName || '').trim();
      this.isAdmin = (
        logData.isAdmin === true ||
        logData.isAdmin === 1 ||
        logData.isAdmin === 'true' ||
        logData.isAdmin === '1' ||
        logUserRole.toLowerCase() === 'administrator' ||
        logUserRole.toLowerCase() === 'admin'
      );
    } catch {
      this.isAdmin = false;
    }
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
  }

  loadHolidaysForYear(year: number): void {
    this.loadedYear = year;
    this.holidayService.getHolidays(year).subscribe({
      next: (res) => {
        if (res && res.flag === '1' && Array.isArray(res.data)) {
          this.allEvents = res.data.map((h: any) => {
            const hDate = new Date(h.HolidayDate ?? h.holidayDate);
            let dateStr = this.formatDateStr(hDate);
            const repeatAnnually = h.RepeatAnnually ?? h.repeatAnnually;
            if (repeatAnnually && hDate.getFullYear() !== year) {
              const projected = new Date(year, hDate.getMonth(), hDate.getDate());
              dateStr = this.formatDateStr(projected);
            }

            const hType = String(h.HolidayType ?? h.holidayType ?? '');
            const hId = h.ID ?? h.id ?? '';

            return {
              id: String(hId),
              title: h.HolidayName ?? h.holidayName ?? '',
              dateStr: dateStr,
              type: hType.toLowerCase().includes('public') ? 'public' : 'company',
              description: h.Description ?? h.description ?? '',
              repeatAnnually: !!repeatAnnually
            };
          });
        } else {
          this.allEvents = [];
        }
        this.renderCalendar();
      },
      error: (err) => {
        console.error('Failed to load holidays:', err);
        this.renderCalendar();
      }
    });
  }

  loadSaturdayConfigsForYear(year: number): void {
    this.holidayService.getSaturdayConfigs(year).subscribe({
      next: (res) => {
        this.saturdayConfigs.clear();
        if (res && res.flag === '1' && Array.isArray(res.data)) {
          res.data.forEach((item: any) => {
            const rawDate = item.SaturdayDate ?? item.saturdayDate;
            if (rawDate) {
              const d = new Date(rawDate);
              const dateStr = this.formatDateStr(d);
              const isOff = item.IsOff ?? item.isOff;
              this.saturdayConfigs.set(dateStr, !!isOff);
            }
          });
        }
        this.renderCalendar();
      },
      error: (err) => {
        console.warn('Could not load Saturday configs from server:', err);
        this.renderCalendar();
      }
    });
  }

  getOrdinalSuffix(n: number): string {
    if (n === 1) return 'st';
    if (n === 2) return 'nd';
    if (n === 3) return 'rd';
    return 'th';
  }

  isSaturdayOff(d: Date): { isOff: boolean; saturdayIndex: number; label: string } {
    const dateStr = this.formatDateStr(d);
    const saturdayIndex = Math.ceil(d.getDate() / 7);
    const suffix = this.getOrdinalSuffix(saturdayIndex);
    const defaultOff = (saturdayIndex === 2 || saturdayIndex === 4);

    if (this.saturdayConfigs.has(dateStr)) {
      const isOff = this.saturdayConfigs.get(dateStr)!;
      return {
        isOff,
        saturdayIndex,
        label: isOff
          ? `${saturdayIndex}${suffix} Saturday (Weekly Off)`
          : `${saturdayIndex}${suffix} Saturday (Working Day)`
      };
    }

    return {
      isOff: defaultOff,
      saturdayIndex,
      label: defaultOff
        ? `${saturdayIndex}${suffix} Saturday (Weekly Off)`
        : `${saturdayIndex}${suffix} Saturday (Working Day)`
    };
  }

  renderCalendar(): void {
    this.updateMonthYearHeader();
    this.generateCalendarDays();
    this.updateUpcomingHolidaysCount();
    this.updateUpcomingHolidaysList();
  }

  updateMonthYearHeader(): void {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    this.monthYearString = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
  }

  prevMonth(): void {
    const prevYear = this.currentDate.getFullYear();
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    if (this.currentDate.getFullYear() !== prevYear) {
      this.loadDataForYear(this.currentDate.getFullYear());
    } else {
      this.renderCalendar();
    }
  }

  nextMonth(): void {
    const prevYear = this.currentDate.getFullYear();
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    if (this.currentDate.getFullYear() !== prevYear) {
      this.loadDataForYear(this.currentDate.getFullYear());
    } else {
      this.renderCalendar();
    }
  }

  goToToday(): void {
    const prevYear = this.currentDate.getFullYear();
    this.currentDate = new Date();
    if (this.currentDate.getFullYear() !== prevYear) {
      this.loadDataForYear(this.currentDate.getFullYear());
    } else {
      this.renderCalendar();
    }
  }

  generateCalendarDays(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: CalendarDay[] = [];

    // Trailing days from previous month
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      days.push(this.createDayObject(d, false));
    }

    // Days in current month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push(this.createDayObject(d, true));
    }

    // Leading days for next month
    const targetCellCount = days.length <= 35 ? 35 : 42;
    const remainingDays = targetCellCount - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(year, month + 1, i);
      days.push(this.createDayObject(d, false));
    }

    this.calendarDays = days;
  }

  createDayObject(d: Date, isCurrentMonth: boolean): CalendarDay {
    const dateStr = this.formatDateStr(d);
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    const dayOfWeek = d.getDay();
    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;
    const isWeekend = isSunday || isSaturday;

    let isPermanentLeave = false;
    let leaveLabel = '';

    if (isSunday) {
      isPermanentLeave = true;
      leaveLabel = 'Sunday (Weekly Off)';
    } else if (isSaturday) {
      const satInfo = this.isSaturdayOff(d);
      isPermanentLeave = satInfo.isOff;
      leaveLabel = satInfo.label;
    }

    const events = this.allEvents.filter(e => e.dateStr === dateStr);

    return {
      date: d,
      dateStr,
      dayNumber: d.getDate(),
      isCurrentMonth,
      isToday,
      isWeekend,
      isSunday,
      isPermanentLeave,
      leaveLabel,
      events
    };
  }

  updateUpcomingHolidaysCount(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const today = new Date();
    const isCurrentMonthView = today.getFullYear() === year && today.getMonth() === month;

    const currentMonthEvents = this.allEvents.filter(e => {
      const parts = e.dateStr.split('-').map(Number);
      const eYear = parts[0];
      const eMonth = parts[1] - 1;
      const eDay = parts[2];

      if (eYear !== year || eMonth !== month) return false;
      if (isCurrentMonthView) {
        return eDay >= today.getDate();
      }
      return true;
    });

    const count = currentMonthEvents.length;
    if (count === 1) {
      this.upcomingCountText = '1 upcoming holiday this month';
    } else if (count > 0) {
      this.upcomingCountText = `${count} upcoming holidays this month`;
    } else {
      this.upcomingCountText = 'No upcoming holidays this month';
    }
  }

  updateUpcomingHolidaysList(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const items: UpcomingHolidayItem[] = [];

    this.allEvents.forEach(e => {
      const parts = e.dateStr.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      if (d.getTime() >= today.getTime()) {
        const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
        const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
        items.push({
          ...e,
          date: d,
          dayNumber: parts[2],
          monthStr: monthShort.toUpperCase(),
          formattedDate: `${dayOfWeek}, ${parts[2]} ${monthShort} ${parts[0]}`,
          relativeLabel: this.getRelativeDayLabel(d)
        });
      }
    });

    items.sort((a, b) => a.date.getTime() - b.date.getTime());
    this.upcomingHolidaysList = items.slice(0, 4);
  }

  getRelativeDayLabel(d: Date): string {
    const today = new Date();
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const targetZero = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffTime = targetZero.getTime() - todayZero.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return '';
  }

  onSelectDate(day: CalendarDay): void {
    this.selectedDate = day.date;
    const dateFormatted = day.date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const isSaturday = day.date.getDay() === 6;

    if (day.events.length > 0) {
      const titles = day.events
        .map(e => `${e.title} (${this.getEventTypeName(e.type)})`)
        .join(', ');
      this.selectedDateInfo = `${dateFormatted}: ${titles}${day.leaveLabel ? ' • ' + day.leaveLabel : ''}`;
    } else if (day.isPermanentLeave) {
      this.selectedDateInfo = `${dateFormatted}: ${day.leaveLabel}`;
    } else if (isSaturday) {
      this.selectedDateInfo = `${dateFormatted}: ${day.leaveLabel || 'Working Saturday'}`;
    } else {
      this.selectedDateInfo = `${dateFormatted}: Working day`;
    }

    // Saturday interaction: open Saturday config/toggle popup
    if (isSaturday) {
      this.selectedSaturdayDay = day;
      this.isSaturdayPopupVisible = true;
      return;
    }

    // Sunday or other permanent leave interaction: open Leave Details modal
    if (day.isPermanentLeave) {
      this.selectedLeaveDay = day;
      this.isLeaveDetailsPopupVisible = true;
    }
  }

  closeSaturdayPopup(): void {
    this.isSaturdayPopupVisible = false;
    this.selectedSaturdayDay = null;
    this.isUpdatingSaturday = false;
  }

  toggleSaturdayStatus(day?: CalendarDay | null): void {
    const targetDay = day || this.selectedSaturdayDay;
    if (!targetDay) return;
    if (!this.isAdmin) {
      notify('Only administrators can configure Saturday work status', 'warning', 2500);
      return;
    }

    const targetIsOff = !targetDay.isPermanentLeave;
    this.isUpdatingSaturday = true;

    this.holidayService.toggleSaturdayStatus(targetDay.dateStr, targetIsOff).subscribe({
      next: (res) => {
        this.isUpdatingSaturday = false;
        if (res && res.flag === '1') {
          this.saturdayConfigs.set(targetDay.dateStr, targetIsOff);
          const statusText = targetIsOff ? 'Weekly Off (Leave)' : 'Working Day';
          notify({
            message: `Saturday (${targetDay.dateStr}) marked as ${statusText}`,
            position: { at: 'top right', my: 'top right' },
            displayTime: 2500
          }, 'success');
          this.closeSaturdayPopup();
          this.renderCalendar();
        } else {
          notify(res?.message || 'Failed to update Saturday status', 'error', 3000);
        }
      },
      error: (err) => {
        this.isUpdatingSaturday = false;
        console.warn('Backend update failed, applying Saturday shift locally:', err);
        // Fallback for offline or local dev
        this.saturdayConfigs.set(targetDay.dateStr, targetIsOff);
        const statusText = targetIsOff ? 'Weekly Off (Leave)' : 'Working Day';
        notify({
          message: `Saturday (${targetDay.dateStr}) set to ${statusText}`,
          position: { at: 'top right', my: 'top right' },
          displayTime: 2500
        }, 'success');
        this.closeSaturdayPopup();
        this.renderCalendar();
      }
    });
  }

  closeLeaveDetailsPopup(): void {
    this.isLeaveDetailsPopupVisible = false;
    this.selectedLeaveDay = null;
  }

  formatFullDate(d?: Date): string {
    if (!d) return '';
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  formatFullDateStr(dateStr?: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-').map(Number);
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return this.formatFullDate(d);
    }
    return dateStr;
  }

  getEventTypeName(type: string): string {
    switch (type) {
      case 'public':
        return 'Public holiday';
      case 'company':
        return 'Company holiday';
      default:
        return 'Holiday';
    }
  }

  openAddHolidayPopup(): void {
    if (!this.isAdmin) return;
    this.isEditMode = false;
    this.editingHolidayId = null;
    this.newHoliday = {
      name: '',
      date: this.formatDateStr(new Date()),
      type: 'Company Holiday',
      description: '',
      repeatAnnually: true
    };
    this.isAddHolidayPopupVisible = true;
  }

  openViewHoliday(item: CalendarEvent | UpcomingHolidayItem): void {
    this.selectedHoliday = item;
    this.isViewHolidayPopupVisible = true;
  }

  closeViewHolidayPopup(): void {
    this.isViewHolidayPopupVisible = false;
    this.selectedHoliday = null;
  }

  switchToEditFromView(): void {
    if (!this.isAdmin || !this.selectedHoliday) return;
    const holidayToEdit = this.selectedHoliday;
    this.closeViewHolidayPopup();
    this.openEditHoliday(holidayToEdit);
  }

  deleteFromView(): void {
    if (!this.isAdmin || !this.selectedHoliday) return;
    const rawId = (this.selectedHoliday as any).id ?? (this.selectedHoliday as any).ID;
    const holidayId = Number(rawId);
    if (!holidayId || isNaN(holidayId)) {
      notify('Invalid holiday identifier', 'error', 3000);
      return;
    }

    confirm('Are you sure you want to delete this holiday?', 'Delete Holiday').then((confirmed: boolean) => {
      if (!confirmed) return;

      this.holidayService.deleteHoliday(holidayId).subscribe({
        next: (res) => {
          if (res && res.flag === '1') {
            notify({
              message: 'Holiday deleted successfully',
              position: { at: 'top right', my: 'top right' },
              displayTime: 2500
            }, 'success');
            this.closeViewHolidayPopup();
            this.loadHolidaysForYear(this.currentDate.getFullYear());
          } else {
            notify(res?.message || 'Failed to delete holiday', 'error', 3000);
          }
        },
        error: (err) => {
          console.error('Delete error:', err);
          notify('Server error deleting holiday. Please ensure the backend is running.', 'error', 3500);
        }
      });
    });
  }

  openEditHoliday(item: CalendarEvent | UpcomingHolidayItem): void {
    if (!this.isAdmin) return;
    this.isEditMode = true;
    this.editingHolidayId = Number(item.id);
    this.newHoliday = {
      name: item.title,
      date: item.dateStr,
      type: item.type === 'public' ? 'Public Holiday' : 'Company Holiday',
      description: item.description || '',
      repeatAnnually: item.repeatAnnually !== false
    };
    this.isAddHolidayPopupVisible = true;
  }

  onEventClick(event: MouseEvent, calEvent: CalendarEvent): void {
    event.stopPropagation();
    this.openViewHoliday(calEvent);
  }

  closeAddHolidayPopup(): void {
    this.isAddHolidayPopupVisible = false;
  }

  saveNewHoliday(): void {
    if (!this.isAdmin) return;
    if (!this.newHoliday.name || !this.newHoliday.name.trim()) {
      notify('Please enter a holiday name', 'warning', 2500);
      return;
    }
    if (!this.newHoliday.date) {
      notify('Please select a valid date', 'warning', 2500);
      return;
    }

    // Validation: Cannot add holiday on company regular leave days (Sunday, 2nd, 4th, 5th Saturday)
    const regularCheck = this.isCompanyRegularHoliday(this.newHoliday.date);
    if (regularCheck.isRegularHoliday) {
      notify({
        message: `Cannot schedule holiday on this date. ${regularCheck.reason}.`,
        position: { at: 'top right', my: 'top right' },
        displayTime: 3500
      }, 'warning');
      return;
    }

    // Validation: Cannot add 2 holidays on the same day
    const isDuplicate = this.allEvents.some(e => {
      if (this.isEditMode && Number(e.id) === this.editingHolidayId) {
        return false;
      }
      return e.dateStr === this.newHoliday.date;
    });

    if (isDuplicate) {
      notify({
        message: 'A holiday is already scheduled for this date. You cannot add multiple holidays on the same day.',
        position: { at: 'top right', my: 'top right' },
        displayTime: 3500
      }, 'warning');
      return;
    }

    const payload: HolidayDto = {
      HolidayName: this.newHoliday.name.trim(),
      HolidayDate: this.newHoliday.date,
      HolidayType: this.newHoliday.type,
      Description: this.newHoliday.description ? this.newHoliday.description.trim() : '',
      RepeatAnnually: !!this.newHoliday.repeatAnnually
    };

    if (this.isEditMode && this.editingHolidayId) {
      payload.ID = this.editingHolidayId;
      this.holidayService.updateHoliday(payload).subscribe({
        next: (res) => {
          if (res && res.flag === '1') {
            notify({
              message: 'Holiday updated successfully',
              position: { at: 'top right', my: 'top right' },
              displayTime: 2500
            }, 'success');
            this.isAddHolidayPopupVisible = false;
            this.loadHolidaysForYear(this.currentDate.getFullYear());
          } else {
            notify(res?.message || 'Failed to update holiday', 'error', 3000);
          }
        },
        error: (err) => {
          console.error(err);
          notify('Server error updating holiday', 'error', 3000);
        }
      });
    } else {
      this.holidayService.insertHoliday(payload).subscribe({
        next: (res) => {
          if (res && res.flag === '1') {
            notify({
              message: 'Holiday added successfully',
              position: { at: 'top right', my: 'top right' },
              displayTime: 2500
            }, 'success');
            this.isAddHolidayPopupVisible = false;
            this.loadHolidaysForYear(this.currentDate.getFullYear());
          } else {
            notify(res?.message || 'Failed to add holiday', 'error', 3000);
          }
        },
        error: (err) => {
          console.error(err);
          notify('Server error adding holiday', 'error', 3000);
        }
      });
    }
  }

  deleteCurrentHoliday(): void {
    if (!this.isAdmin || !this.editingHolidayId) return;

    confirm('Are you sure you want to delete this holiday?', 'Delete Holiday').then((confirmed: boolean) => {
      if (!confirmed) return;

      this.holidayService.deleteHoliday(this.editingHolidayId!).subscribe({
        next: (res) => {
          if (res && res.flag === '1') {
            notify({
              message: 'Holiday deleted successfully',
              position: { at: 'top right', my: 'top right' },
              displayTime: 2500
            }, 'success');
            this.isAddHolidayPopupVisible = false;
            this.loadHolidaysForYear(this.currentDate.getFullYear());
          } else {
            notify(res?.message || 'Failed to delete holiday', 'error', 3000);
          }
        },
        error: (err) => {
          console.error('Delete error:', err);
          notify('Server error deleting holiday. Please ensure the backend is running.', 'error', 3500);
        }
      });
    });
  }

  isCompanyRegularHoliday(dateInput: Date | string): { isRegularHoliday: boolean; reason: string } {
    if (!dateInput) {
      return { isRegularHoliday: false, reason: '' };
    }

    let d: Date;
    if (typeof dateInput === 'string') {
      const parts = dateInput.split('-').map(Number);
      if (parts.length === 3) {
        d = new Date(parts[0], parts[1] - 1, parts[2]);
      } else {
        d = new Date(dateInput);
      }
    } else {
      d = dateInput;
    }

    if (isNaN(d.getTime())) {
      return { isRegularHoliday: false, reason: '' };
    }

    const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
    if (dayOfWeek === 0) {
      return { isRegularHoliday: true, reason: 'Sundays are permanent company holidays (Weekly Off)' };
    }

    if (dayOfWeek === 6) {
      const satInfo = this.isSaturdayOff(d);
      if (satInfo.isOff) {
        return { isRegularHoliday: true, reason: `${satInfo.label} is designated as a Weekly Off` };
      }
    }

    return { isRegularHoliday: false, reason: '' };
  }

  getRegularHolidayWarning(dateInput: string): string {
    const res = this.isCompanyRegularHoliday(dateInput);
    return res.isRegularHoliday ? res.reason : '';
  }

  private formatDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    DxButtonModule,
    DxPopupModule
  ],
  declarations: [CalendarComponent],
  exports: [CalendarComponent]
})
export class CalendarModule {}
