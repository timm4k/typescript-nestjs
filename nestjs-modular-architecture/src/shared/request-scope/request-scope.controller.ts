import { Controller, Get } from '@nestjs/common';
import { RequestIdService } from './request-id.service.js';
import { RequestScopeService } from './request-scope.service.js';

export interface RequestScopeResult {
  scope: 'REQUEST';
  controllerInstanceId: string;
  serviceInstanceId: string;
  sameInstance: boolean;
}

@Controller('diagnostics')
export class RequestScopeController {
  constructor(
    private readonly requestId: RequestIdService,
    private readonly requestScopeService: RequestScopeService,
  ) {}

  @Get('request-scope')
  inspect(): RequestScopeResult {
    const serviceInstanceId = this.requestScopeService.getInstanceId();
    return {
      scope: 'REQUEST',
      controllerInstanceId: this.requestId.id,
      serviceInstanceId,
      sameInstance: this.requestId.id === serviceInstanceId,
    };
  }
}
