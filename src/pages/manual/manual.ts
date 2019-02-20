import { Component, ElementRef } from '@angular/core';
import { ActionSheetController, LoadingController } from 'ionic-angular';

import { IngenicoProvider } from '../../providers/ingenico/ingenico';
import { Amount } from '../../providers/ingenico/models/com.ingenico.mpos.sdk.data/amount';
import { Product } from '../../providers/ingenico/models/com.ingenico.mpos.sdk.data/product';
import { CashSaleTransactionRequest } from '../../providers/ingenico/models/com.ingenico.mpos.sdk.request/cash-sale-transaction-request';
import { Device } from '../../providers/ingenico/models/com.roam.roamreaderunifiedapi.data/device';
import { DeviceType } from '../../providers/ingenico/models/com.roam.roamreaderunifiedapi.constants/device-type';

@Component({
  selector: 'page-manual',
  templateUrl: 'manual.html'
})
export class ManualPage {
  username: string;
  password: string;

  message: string;

  request: CashSaleTransactionRequest;

  currency: string = "USD";
  prod: string = "0";
  quantity: string = "1";
  subtotal: number;
  tax: number;
  total: number;
  discount: number = 0;

  devices: Device[];

  productVal = 0;
  productName = "";
  taxValue = 0.07;
  constructor(public ingenico: IngenicoProvider, public actionSheetCtrl: ActionSheetController, public loadingCtrl: LoadingController, private elRef: ElementRef) {
    this.username = "logicstudiotest1";
    this.password = "logicstudio";

    this.updateValues();
  }

  setDeviceType(){
    this.ingenico.setDeviceType(DeviceType.RP750x).then(result => {
      this.ingenico.searchForDevice().then(result => {
        this.devices = result;
        this.elRef.nativeElement.querySelector('#device-list-container').style.display = "block";
      }).catch(error => {
        alert(error);
      });
    }).catch(error => {
      alert(error);
    });
  }

  login(){
    this.ingenico.login(this.username, this.password, "CAT6-64a80ac1-0ff3-4d32-ac92-5558a6870a88", "https://uatmcm.roamdata.com/", "0.1").then(result => {
        this.setDeviceType();
    }).catch(error => {
      alert("ERROR: " + error);
    });
  }

  processCash() {
    var amount = new Amount("USD", this.total, this.subtotal, this.tax, this.discount, "", 0);
    var products = new Array<Product>();

    var product = new Product(this.productName, this.productVal, this.productName, "", parseInt(this.quantity));
    products.push(product);

    this.request = new CashSaleTransactionRequest(amount, products, null, null, null);
    console.log(JSON.stringify(this.request));

    this.ingenico.processCashTransaction(this.request).then(result => {
      alert(result.transactionResponseCode);
    }).catch(error => {
      alert("ERROR: " + error);
    });
  }

  processCredit() {
    var amount = new Amount("USD", this.total, this.subtotal, this.tax, this.discount, "", 0);
    var products = new Array<Product>();

    var product = new Product(this.productName, this.productVal, this.productName, "", parseInt(this.quantity));
    products.push(product);

    this.request = new CashSaleTransactionRequest(amount, products, "", "", null);
    console.log(JSON.stringify(this.request));

    this.ingenico.processCreditSaleTransactionWithCardReader(this.request).then(result => {
      alert(result.transactionResponseCode);
    }).catch(error => {
      alert("ERROR: " + error);
    });
  }

  updateValues() {
    switch(this.prod){
      case "0": 
        this.productVal = 300;
        this.productName = "Product #1";
        break;
      case "1": 
        this.productVal = 450;
        this.productName = "Product #2";    
        break;
      case "2": 
        this.productVal = 600;
        this.productName = "Product #3";      
        break;
    }

    var quantity = parseInt(this.quantity);
    this.subtotal = (this.productVal * quantity);
    this.tax = this.productVal * this.taxValue * quantity;
    this.total = this.productVal * ( this.taxValue + 1 ) * quantity;

    this.subtotal = parseInt(this.subtotal + "");
    this.tax = parseInt(this.tax + "");
    this.total = parseInt(this.total + "");
  }

  showDevices(devices: Device[]) {
    var buttons = [];

    for(var c = 0; c < devices.length; c++){
      var device = devices[c];
      var obj = {
        text: devices[c].name,
        handler: () => {   
          this.deviceSelected(device);
        }
      }
      buttons.push(obj);
    }
    const actionSheet = this.actionSheetCtrl.create({
      title: 'Seleccione el dispositivo de pago.',
      buttons: buttons
    });
    actionSheet.present(); 
  }

  deviceSelected(device: Device){
    this.ingenico.selectDevice(device).then(result => {
      if (result){
        let loading = this.loadingCtrl.create({
          content: 'Configurando el dispositivo...'
        });
    
        loading.present();

        this.ingenico.setupDevice().then(result => {
          if (result){          
            loading.dismiss();
            var loginContainer = this.elRef.nativeElement.querySelector('.login-container');
            var manualCardEntryContainer = this.elRef.nativeElement.querySelector('.manual-card-entry-container');
      
            loginContainer.style.display = "none";
            manualCardEntryContainer.style.display = "block";
          } else {
            loading.dismiss();
            alert("No se pudo configurar el dispositivo.");
          }
        }).catch(error => {
          loading.dismiss();
          alert("SETUP ERROR: " + error);
        });               
      } else {
        alert("No se pudo seleccionar el dispositivo.");
      }    
    }).catch(error => {
      alert("SELECT ERROR: " + error);
    });
  }
}
