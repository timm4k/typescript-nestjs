import { randomUUID } from 'node:crypto';
import { Injectable, Logger, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class RequestIdService {
  readonly id = randomUUID();

  constructor() {
    new Logger(RequestIdService.name).log(
      `Created request-scoped instance ${this.id}`,
    );
  }
}
