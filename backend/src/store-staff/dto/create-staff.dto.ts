import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { StaffRole } from '../store-staff.entity';

export class CreateStaffDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString() @MinLength(6)
  password: string;

  @IsEnum(StaffRole)
  role: StaffRole;
}
