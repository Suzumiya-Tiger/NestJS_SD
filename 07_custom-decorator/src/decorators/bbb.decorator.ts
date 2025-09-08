import { applyDecorators, Get, UseGuards } from '@nestjs/common';
import { AaaGuard } from 'src/aaa.guard';
import { Aaa } from './aaa.decorator';
export function Bbb(path: string, role: string) {
  return  (Get(path), Aaa(role), UseGuards(AaaGuard));
}
