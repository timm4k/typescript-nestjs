import {
  BadRequestException,
  Injectable,
  type ArgumentMetadata,
  type PipeTransform,
} from '@nestjs/common';

const maximumDepth = 64;

@Injectable()
export class TrimPipe implements PipeTransform<unknown, unknown> {
  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    return this.trim(value, 0);
  }

  private trim(value: unknown, depth: number): unknown {
    if (depth > maximumDepth) {
      throw new BadRequestException(
        'Input nesting exceeds the supported depth',
      );
    }
    if (typeof value === 'string') {
      return value.trim();
    }
    if (Array.isArray(value)) {
      return value.map((item: unknown) => this.trim(item, depth + 1));
    }
    if (typeof value === 'object' && value !== null) {
      const prototype: unknown = Object.getPrototypeOf(value);
      if (prototype !== Object.prototype && prototype !== null) {
        return value;
      }
      return Object.fromEntries(
        Object.entries(value).map(([key, item]: [string, unknown]) => [
          key,
          this.trim(item, depth + 1),
        ]),
      );
    }
    return value;
  }
}
