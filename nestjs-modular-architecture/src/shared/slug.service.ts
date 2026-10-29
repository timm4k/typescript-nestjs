import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class SlugService {
  generateSlug(title: string): string {
    const slug = title
      .normalize('NFKD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '');
    if (slug.length === 0) {
      throw new BadRequestException(
        'Title must contain at least one letter or number',
      );
    }
    return slug;
  }
}
