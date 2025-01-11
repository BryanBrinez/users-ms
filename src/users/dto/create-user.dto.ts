import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  public name: string; // Nombre del usuario

  @IsEmail()
  public email: string; // Correo electrónico del usuario

  @IsString()
  @IsStrongPassword()
  password: string;

  @IsBoolean()
  @IsOptional()
  public status?: boolean; // Estado del usuario, por defecto true (activo)
}
