import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IndexListPage } from './index-list.page';

describe('IndexListPage', () => {
  let component: IndexListPage;
  let fixture: ComponentFixture<IndexListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(IndexListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
