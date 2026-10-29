import { Injectable } from '@nestjs/common';
import { RequestIdService } from './request-id.service.js';

@Injectable()
export class RequestScopeService {
  constructor(private readonly requestId: RequestIdService) {}

  getInstanceId(): string {
    return this.requestId.id;
  }
}
