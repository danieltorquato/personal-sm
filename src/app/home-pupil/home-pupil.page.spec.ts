import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomePupilPage } from './home-pupil.page';

describe('HomePupilPage', () => {
  let component: HomePupilPage;
  let fixture: ComponentFixture<HomePupilPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HomePupilPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
