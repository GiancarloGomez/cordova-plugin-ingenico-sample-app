import { Injectable } from '@angular/core';

import { Plugin, Cordova } from '@ionic-native/core';
import { UserProfile } from './models/com.ingenico.mpos.sdk.data/user-profile';
import { CashSaleTransactionRequest } from './models/com.ingenico.mpos.sdk.request/cash-sale-transaction-request';
import { CreditSaleTransactionRequest } from './models/com.ingenico.mpos.sdk.request/credit-sale-transaction-request';
import { DebitSaleTransactionRequest } from './models/com.ingenico.mpos.sdk.request/debit-sale-transaction-request';
import { TransactionResponse } from './models/com.ingenico.mpos.sdk.response/transaction-response';
import { Device } from './models/com.roam.roamreaderunifiedapi.data/device';

@Plugin({
  pluginName: "ingenicoionic", 
  plugin: "cordova-plugin-ionic-ingenico",
  pluginRef: "IngenicoIonic",
  platforms: ['Android', 'iOS']
})


@Injectable()
export class IngenicoProvider {

  @Cordova()
  login(arg0: string, arg1: string): Promise<UserProfile>{
    return;
  }

  @Cordova()
  connect(): Promise<boolean>{
    return;
  }

  @Cordova()
  onDeviceDisconnected(): Promise<boolean>{
    return ;
  }

  @Cordova()
  setDeviceType(arg0: any): Promise<boolean>{
    return;
  }

  @Cordova()
  searchForDevice(): Promise<Device[]>{
    return;
  }

  @Cordova()
  stopSearchForDevice(): Promise<boolean>{
    return;
  }

  @Cordova()
  selectDevice(arg0: Device): Promise<boolean>{
    return;
  }

  @Cordova()
  setupDevice(): Promise<boolean>{
    return;
  }

  @Cordova()
  processCashTransaction(arg0: CashSaleTransactionRequest): Promise<TransactionResponse> {
    return;
  }

  @Cordova()
  processCreditSaleTransactionWithCardReader(arg0: CreditSaleTransactionRequest): Promise<TransactionResponse> {
    return;
  }

  @Cordova()
  processDebitSaleTransactionWithCardReader(arg0: DebitSaleTransactionRequest): Promise<TransactionResponse> {
    return;
  }

  @Cordova()
  uploadSignature(arg0: string, arg1: string): Promise<boolean> {
    return;
  }

  @Cordova()
  getReferenceForTransactionWithPendingSignature(): Promise<string> {
    return;
  }
}