import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { MyApp } from './app.component';
import { ChargeFormPage, InstructionsPage, SamplePage } from '../pages/pages';
import { ConfigService, LoadingAndErrorHandling } from '../providers/services';
import { Ingenico } from '../providers/ingenico';

@NgModule({
    declarations: [
        MyApp,
        ChargeFormPage,
        InstructionsPage,
        SamplePage
    ],
    imports: [
        BrowserModule,
        IonicModule.forRoot(MyApp)
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        MyApp,
        ChargeFormPage,
        InstructionsPage,
        SamplePage
    ],
    providers: [
        ConfigService,
        Ingenico,
        LoadingAndErrorHandling,
        SplashScreen,
        StatusBar,
        {provide: ErrorHandler, useClass: IonicErrorHandler}
    ]
})
export class AppModule {}
