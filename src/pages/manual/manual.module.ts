import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ManualPage } from './manual';

@NgModule({
  declarations: [
    ManualPage,
  ],
  imports: [
    IonicPageModule.forChild(ManualPage),
  ],
})
export class ManualPageModule {}
