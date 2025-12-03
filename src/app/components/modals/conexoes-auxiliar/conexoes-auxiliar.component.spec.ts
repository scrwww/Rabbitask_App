import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ConexoesAuxiliarComponent } from './conexoes-auxiliar.component';

describe('ConexoesAuxiliarComponent', () => {
  let component: ConexoesAuxiliarComponent;
  let fixture: ComponentFixture<ConexoesAuxiliarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ConexoesAuxiliarComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ConexoesAuxiliarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
