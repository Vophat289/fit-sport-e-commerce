import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThanhloiComponent } from './thanhloi.component';

describe('ThanhloiComponent', () => {
  let component: ThanhloiComponent;
  let fixture: ComponentFixture<ThanhloiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThanhloiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThanhloiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
