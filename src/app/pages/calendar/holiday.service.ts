import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from 'src/app/services/config.service';

export interface HolidayDto {
  ID?: number;
  HolidayName: string;
  HolidayDate: string; // YYYY-MM-DD
  HolidayType: string; // 'Company Holiday' | 'Public Holiday'
  Description?: string;
  RepeatAnnually: boolean;
}

export interface SaturdayConfigDto {
  ID?: number;
  SaturdayDate: string;
  IsOff: boolean;
  UpdatedDate?: string;
}

export interface ApiResponse<T> {
  flag: string; // '1' | '0'
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class HolidayService {
  constructor(
    private http: HttpClient,
    private config: ConfigService
  ) {}

  private get baseUrl(): string {
    return this.config.apiBaseUrl;
  }

  getHolidays(year?: number): Observable<ApiResponse<HolidayDto[]>> {
    const url = year 
      ? `${this.baseUrl}Holiday/list?year=${year}` 
      : `${this.baseUrl}Holiday/list`;
    return this.http.get<ApiResponse<HolidayDto[]>>(url);
  }

  getHolidayById(id: number): Observable<ApiResponse<HolidayDto[]>> {
    const url = `${this.baseUrl}Holiday/select/${id}`;
    return this.http.get<ApiResponse<HolidayDto[]>>(url);
  }

  insertHoliday(holiday: HolidayDto): Observable<ApiResponse<HolidayDto>> {
    const url = `${this.baseUrl}Holiday/insert`;
    return this.http.post<ApiResponse<HolidayDto>>(url, holiday);
  }

  updateHoliday(holiday: HolidayDto): Observable<ApiResponse<HolidayDto>> {
    const url = `${this.baseUrl}Holiday/update`;
    return this.http.put<ApiResponse<HolidayDto>>(url, holiday);
  }

  deleteHoliday(id: number): Observable<ApiResponse<any>> {
    const url = `${this.baseUrl}Holiday/delete/${id}`;
    return this.http.delete<ApiResponse<any>>(url);
  }

  getSaturdayConfigs(year?: number): Observable<ApiResponse<SaturdayConfigDto[]>> {
    const url = year 
      ? `${this.baseUrl}Holiday/saturday-configs?year=${year}` 
      : `${this.baseUrl}Holiday/saturday-configs`;
    return this.http.get<ApiResponse<SaturdayConfigDto[]>>(url);
  }

  toggleSaturdayStatus(saturdayDate: string, isOff: boolean): Observable<ApiResponse<SaturdayConfigDto>> {
    const url = `${this.baseUrl}Holiday/saturday-toggle`;
    return this.http.post<ApiResponse<SaturdayConfigDto>>(url, {
      SaturdayDate: saturdayDate,
      IsOff: isOff
    });
  }
}

