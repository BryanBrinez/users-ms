import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { CreateUserDto } from './dto/create-user.dto';
import { NATS_SERVICE } from 'src/config/services';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UsersService extends PrismaClient implements OnModuleInit {

  constructor(

    @Inject(NATS_SERVICE) private readonly client: ClientProxy
  ) {

    super()
  }
  onModuleInit() {
    this.$connect();
  }


  async create(createUserDto: CreateUserDto) {
    const { name, email, password, status = true } = createUserDto;




    try {
      // Llamada al microservicio de autenticación para registrar el usuario (este maneja la contraseña)
      const authUser = await firstValueFrom(
        this.client.send('auth.register.user', { email, name, password })  // Pasamos la contraseña
      );

      

      // Crear el usuario en la base de datos sin la contraseña
      const newUser =  await this.user.create({
        data: {
          email: email,
          name: name,
          status: status,  // Asignar un valor por defecto para el estado
        },
      });

      return {
        data: newUser,
        token: authUser.token,
      };
    } catch (error) {
      throw error;
    }
  }

  async findAll(paginationDto: PaginationDto) {

    const { page, limit } = paginationDto

    const totalPages = await this.user.count()

    const lastPages = Math.ceil(totalPages / limit)


    return {
      data: await this.user.findMany({
        skip: (page - 1) * limit,
        take: limit
      }),
      metadata: {
        totalPages: totalPages,
        page: page,
        lastPages: lastPages
      }


    }
  }

  async findOne(id: string) {

    const user = await this.user.findFirst(
      {
        where: {
          id: id
        }
      }
    )

    if (!user) {

      throw new RpcException({ message: `User with id ${id} not found`, status: HttpStatus.BAD_REQUEST })
    }

    return user

  }

  async update(id: string, updateUserDto: UpdateUserDto) {

    const { id: __, ...data } = updateUserDto

    try {
      await this.findOne(id)

    } catch (error) {
      throw new RpcException({ message: `User with id ${id} not found`, status: HttpStatus.BAD_REQUEST })
    }

    return this.user.update({
      where: { id },
      data: data

    })
  }


  remove(id: string) {
    return this.user.update({
      where: { id },
      data: { status: false }

    })
  }
}