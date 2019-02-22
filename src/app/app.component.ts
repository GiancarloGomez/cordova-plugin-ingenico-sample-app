import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { HomePage, ManualPage, TerminalPage } from '../pages/pages';
import { ConfigService } from '../providers/providers';

@Component({
    templateUrl: 'app.html'
})

export class MyApp {

    logStyle            : string ;
    debug               : boolean;
    rootPage            : any = TerminalPage;

    constructor(
        platform: Platform,
        statusBar: StatusBar,
        splashScreen: SplashScreen,
        public configService: ConfigService
    ) {
        this.debug     = this.configService.getDebug();
        this.logStyle  = this.configService.getLogStyles().app;
        if (this.debug) {console.log(`%cMyApp.constructor()`,this.logStyle);}
        // platform ready events
        platform.ready().then(() => {
            if (this.debug) {console.log(`%c******* PLATFORM READY FIRED *******`,this.configService.getLogStyles().platformReady);}
            statusBar.styleDefault();
            splashScreen.hide();
        });
    }
}

