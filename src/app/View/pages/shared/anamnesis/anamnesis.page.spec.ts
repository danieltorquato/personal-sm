import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnamnesisPage } from './anamnesis.page';

describe('AnamnesisPage', () => {
  let component: AnamnesisPage;
  let fixture: ComponentFixture<AnamnesisPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AnamnesisPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
