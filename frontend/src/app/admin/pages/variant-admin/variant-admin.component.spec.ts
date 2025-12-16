import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VariantAdminComponent } from './variant-admin.component';

describe('VariantAdminComponent', () => {
  let component: VariantAdminComponent;
  let fixture: ComponentFixture<VariantAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VariantAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VariantAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
