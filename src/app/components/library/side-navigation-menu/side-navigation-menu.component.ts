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
      if (m.path === 'speciality') m.path = 'projects';
      if (m.path === 'clinician-profession') m.path = 'timesheet';
      if (m.path === 'clinician-category') m.path = 'designation';

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
    }

    const logData = JSON.parse(localStorage.getItem('logData') || '{}');
    const email = logData.emailID || logData.EmailID || logData.emailId || '';
    const empName = logData.employeeName || logData.EmployeeName || '';
    const isAdmin = email === 'bimal@renazentit.com' || empName.toLowerCase() === 'bimal';

    if (!isAdmin) {
      navItems = navItems.filter((m: any) =>
        !(m.text === 'Reports' || m.text === 'Sidebar Reports' || (m.MenuName && m.MenuName.includes('Report')) || m.path === 'timesheet-summary')
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

    menuItems.forEach((item) => {
      lookup[item.id] = { ...item, items: [] };

      if (item.GroupID === '0') {
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
