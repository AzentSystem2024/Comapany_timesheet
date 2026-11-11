import { AuthService, DataService } from 'src/app/services';
import {
  Component,
  NgModule,
  Output,
  Input,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  OnInit,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import {
  DxTreeViewModule,
  DxTreeViewComponent,
  DxTreeViewTypes,
} from 'devextreme-angular/ui/tree-view';
import { DxTabPanelModule } from 'devextreme-angular';
import * as events from 'devextreme/events';
import { AnyARecord } from 'dns';

@Component({
  selector: 'side-navigation-menu',
  templateUrl: './side-navigation-menu.component.html',
  styleUrls: ['./side-navigation-menu.component.scss'],
})
export class SideNavigationMenuComponent
  implements AfterViewInit, OnDestroy, OnInit {
  @ViewChild(DxTreeViewComponent, { static: true })
  menu!: DxTreeViewComponent;

  @Output() selectedItemChanged =
    new EventEmitter<DxTreeViewTypes.ItemClickEvent>();

  @Output() openMenu = new EventEmitter<any>();

  private _selectedItem: string = '';
  private _compactMode = false;
  private _items!: Record<string, unknown>[];
  navigation: any[] = [];
  selectedItemKeys: string[] = [];
  customerInfo: { customerName: any; version: string };

  @Input()
  set selectedItem(value: string) {
    this._selectedItem = value.replace(/^\//, '');
    this.setSelectedItem();
  }

  get selectedItem(): string {
    return this._selectedItem;
  }

  @Input()
  set compactMode(val: boolean) {
    this._compactMode = val;

    if (!this.menu?.instance) return;

    if (val) {
      this.menu.instance.collapseAll();
    } else {
      this.menu.instance.expandItem(this._selectedItem);
    }
  }

  get items() {
    if (!this._items) {
      this._items = this.transformMenuData(this.navigation);
    }
    return this._items;
  }

  expandedItemKey: any = null;

  constructor(
    private elementRef: ElementRef,
    private AuthService: AuthService,
    private dataservice: DataService
  ) { }

  ngOnInit(): void {
    const rawMenu = localStorage.getItem('sidemenuItems');
    let navItems = rawMenu ? JSON.parse(rawMenu) : [];

    navItems.forEach((m: any) => {
      if (m.path === 'speciality') { m.path = 'projects'; m.text = 'Projects'; }
      if (m.path === 'clinician-profession') { m.path = 'timesheet'; m.text = 'Timesheet'; }
      if (m.path === 'clinician-category') { m.path = 'designation'; m.text = 'Designation'; }

      if (m.text === 'Reports' || m.text === 'Sidebar Reports' || (m.MenuName && m.MenuName.includes('Report'))) {
        m.path = undefined; // Parent becomes a dropdown container
        m.icon = 'doc';
      }
    });

    const reportMenu = navItems.find((m: any) => m.text === 'Reports' || m.text === 'Sidebar Reports' || (m.MenuName && m.MenuName.includes('Report')));
    if (reportMenu) {
      navItems.push({
        id: 'timesheet-summary-menu',
        text: 'Timesheet-Summary',
        path: 'timesheet-summary',
        GroupID: reportMenu.id
      });
      navItems.push({
        id: 'attendance-menu',
        text: 'Attendance',
        path: 'attendance',
        GroupID: reportMenu.id
      });
    }

    let systemMenu = navItems.find((m: any) => m.text === 'System' || (m.MenuName && m.MenuName.includes('System')));
    if (!systemMenu) {
      systemMenu = {
        id: 'system-menu',
        text: 'System',
        path: undefined,
        GroupID: '0',
        icon: 'toolbox'
      };
      navItems.push(systemMenu);
    } else {
      systemMenu.path = undefined;
      systemMenu.icon = 'toolbox';
    }

    const securityPolicyMenu = navItems.find((m: any) => m.path === 'security-policy');
    if (!securityPolicyMenu) {
      navItems.push({
        id: 'security-policy-menu',
        text: 'Security Policy',
        path: 'security-policy',
        GroupID: systemMenu.id
      });
    }

    // --- CREATE 'DATAS' PARENT MENU ---
    let datasMenu = navItems.find((m: any) => m.text === 'DATAS' || m.text === 'Datas' || m.text === 'Operations' || m.id === 'datas-menu');
    if (!datasMenu) {
      datasMenu = {
        id: 'datas-menu',
        text: 'Operations',
        path: undefined,
        GroupID: '0',
        icon: 'folder'
      };
      navItems.push(datasMenu);
    } else {
      datasMenu.text = 'Operations';
    }

    // Move Reports BELOW Operations
    if (reportMenu) {
      reportMenu.GroupID = '0';
      // Pull reportMenu out of its current position and push it to the end
      navItems = navItems.filter((m: any) => m.id !== reportMenu.id);
      navItems.push(reportMenu);
    }

    // Move Timesheet inside DATAS
    const timesheetMenu = navItems.find((m: any) => m.path === 'timesheet' || m.text === 'Timesheet');
    if (timesheetMenu) {
      timesheetMenu.GroupID = datasMenu.id;
      timesheetMenu.text = 'Timesheet';
    } else {
      navItems.push({
        id: 'timesheet-menu',
        text: 'Timesheet',
        path: 'timesheet',
        GroupID: datasMenu.id,
        icon: 'clock'
      });
    }

    const userLogMenu = navItems.find((m: any) => m.path === 'user-log' || (m.text && m.text.toUpperCase() === 'USER LOG'));
    if (userLogMenu) {
      userLogMenu.GroupID = datasMenu.id;
    } else {
      navItems.push({
        id: 'user-log-menu',
        text: 'User Log',
        path: 'user-log', // Assuming the path should be 'user-log'
        GroupID: datasMenu.id
      });
    }

    const calendarMenu = navItems.find((m: any) => m.path === 'calendar' || (m.text && m.text.toUpperCase() === 'CALENDAR'));
    if (calendarMenu) {
      calendarMenu.GroupID = datasMenu.id;
      calendarMenu.text = 'Calendar';
    } else {
      navItems.push({
        id: 'calendar-menu',
        text: 'Calendar',
        path: 'calendar',
        GroupID: datasMenu.id
      });
    }

    // Ensure order inside Operations: Timesheet -> User Log -> Calendar
    const opsTimesheet = navItems.find((m: any) => m.path === 'timesheet' || m.id === 'timesheet-menu');
    const opsUserLog = navItems.find((m: any) => m.path === 'user-log' || m.id === 'user-log-menu');
    const opsCalendar = navItems.find((m: any) => m.path === 'calendar' || m.id === 'calendar-menu');

    navItems = navItems.filter(
      (m: any) => m !== opsTimesheet && m !== opsUserLog && m !== opsCalendar
    );
    if (opsTimesheet) navItems.push(opsTimesheet);
    if (opsUserLog) navItems.push(opsUserLog);
    if (opsCalendar) navItems.push(opsCalendar);
    // ----------------------------------

    const logData = JSON.parse(localStorage.getItem('logData') || '{}');
    const email = logData.emailID || logData.EmailID || logData.emailId || '';
    const empName = logData.employeeName || logData.EmployeeName || '';
    const isAdmin = logData.isAdmin === true || logData.isAdmin === 1;

    if (!isAdmin) {
      navItems = navItems.filter((m: any) =>
        !(
          m.text === 'Reports' ||
          m.text === 'Sidebar Reports' ||
          (m.MenuName && m.MenuName.includes('Report')) ||
          m.path === 'timesheet-summary' ||
          m.path === 'report-designer' ||
          m.text === 'System' ||
          (m.MenuName && m.MenuName.includes('System')) ||
          m.path === 'security-policy'
        )
      );
    }

    this.navigation = navItems;
    const defaultPath = isAdmin ? 'employee-master' : 'timesheet';
    this.selectedItem = defaultPath;
    this.setSelectedItem();
    this.customerInfo = this.dataservice.fetch_customer_name();
  }

  onTreeItemExpanded(e: any): void {
    const expandedItemId = e.itemData?.id;
    this.menu.instance.collapseAll();
    if (!expandedItemId || !this.menu?.instance) return;
    this.menu.instance.expandItem(expandedItemId);
  }

  ngAfterViewInit(): void {
    this.setSelectedItem();

    events.on(this.elementRef.nativeElement, 'dxclick', (e: Event) => {
      this.openMenu.next(e);
    });
  }

  ngOnDestroy(): void {
    events.off(this.elementRef.nativeElement, 'dxclick');
  }

  onItemClick(event: DxTreeViewTypes.ItemClickEvent): void {
    const clickedItem = event.itemData;
    const clickedItemKey = String(clickedItem?.id);

    if (!this.menu?.instance || !clickedItemKey) return;

    // 1. Leaf node? Emit and skip collapse/expand
    if (clickedItem?.path) {
      this.selectedItem = clickedItem.path;
      this.selectedItemChanged.emit(event);
      return;
    }

    const treeView: any = this.menu.instance;

    const itemMap = new Map<string, any>();
    this.items.forEach((i) => itemMap.set(String(i.id), i));

    const clickedGroupID = String(clickedItem.GroupID || '0');

    this.items.forEach((i) => {
      const siblingKey = String(i.id);
      if (
        siblingKey !== clickedItemKey &&
        String(i.GroupID || '0') === clickedGroupID
      ) {
        treeView.collapseItem(siblingKey);
      }
    });

    if (treeView.isItemExpanded(clickedItemKey)) {
      treeView.collapseItem(clickedItemKey);
    } else {
      treeView.expandItem(clickedItemKey);
    }

    // 5. Track expanded item
    this.expandedItemKey = clickedItemKey;
  }

  setSelectedItem(): void {
    if (this.menu?.instance && this._selectedItem) {
      const selectedItem = this.navigation.find(
        (item) => item.path === this._selectedItem
      );
      if (!selectedItem) return;

      this.menu.instance.selectItem(selectedItem.id);
      this.selectedItemKeys = [selectedItem.id];
      this.expandParentNodes(selectedItem.id);
    }
  }

  expandParentNodes(selectedId: string): void {
    const flatItems = this.navigation;
    const itemMap: { [key: string]: any } = {};

    flatItems.forEach((item) => (itemMap[item.id] = item));

    let parentId = itemMap[selectedId]?.GroupID;
    while (parentId && parentId !== '0') {
      const parentItem = itemMap[parentId];
      if (parentItem) {
        this.menu.instance.expandItem(parentItem.id);
        parentId = parentItem.GroupID;
      } else {
        break;
      }
    }
  }

  private transformMenuData(menuItems: any[]): any[] {
    const lookup: { [key: string]: any } = {};
    const rootMenus: any[] = [];

    // First pass: initialize lookup
    menuItems.forEach((item) => {
      lookup[item.id] = { ...item, items: [] };
    });

    // Second pass: build the tree
    menuItems.forEach((item) => {
      if (item.GroupID === '0' || !item.GroupID) {
        rootMenus.push(lookup[item.id]);
      } else {
        if (lookup[item.GroupID]) {
          lookup[item.GroupID].items.push(lookup[item.id]);
        }
      }
    });

    return rootMenus;
  }
}

@NgModule({
  imports: [DxTreeViewModule, DxTabPanelModule],
  declarations: [SideNavigationMenuComponent],
  exports: [SideNavigationMenuComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SideNavigationMenuModule { }
