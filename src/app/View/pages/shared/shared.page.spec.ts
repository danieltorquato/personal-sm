import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedPage } from './shared.page';

describe('SharedPage', () => {
  let component: SharedPage;
  let fixture: ComponentFixture<SharedPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SharedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
