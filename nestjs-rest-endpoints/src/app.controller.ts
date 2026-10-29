import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getInfo(): { application: string; resource: string; storage: string } {
    return {
      application: 'Clothes REST API',
      resource: '/clothes',
      storage: 'in-memory',
    };
  }
}
