import { Transform } from 'class-transformer';

/** Trims string input before validation, so "   " fails @IsNotEmpty instead of saving a blank value. */
export const Trim = () => Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value));
