import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { MyApp } from './app.component';
import { HomePage,ManualPage,TerminalPage } from '../pages/pages';
import { ConfigService } from '../providers/config.service';
import { IngenicoProvider } from '../../plugins/cordova-plugin-ionic-ingenico/core/providers';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    TerminalPage,
    ManualPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    TerminalPage,
    ManualPage
  ],
  providers: [
    ConfigService,
    IngenicoProvider,
    SplashScreen,
    StatusBar,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
