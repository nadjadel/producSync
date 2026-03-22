import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ user: UserDocument; token: string }> {
    const { email, password, first_name, last_name, role } = registerDto;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = new this.userModel({
      email,
      password: hashedPassword,
      first_name,
      last_name,
      role: role || 'operator',
      status: 'active',
    });

    await user.save();

    // Générer le token JWT
    const token = this.generateToken(user);

    return { user, token };
  }

  async login(loginDto: LoginDto): Promise<{ user: UserDocument; token: string }> {
    const { email, password } = loginDto;

    // Trouver l'utilisateur
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier le statut
    if (user.status !== 'active') {
      throw new UnauthorizedException('Votre compte est désactivé');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Mettre à jour la dernière connexion
    user.last_login = new Date();
    await user.save();

    // Générer le token JWT
    const token = this.generateToken(user);

    return { user, token };
  }

  async validateUser(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }
    return user;
  }

  async getProfile(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }
    return user;
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Ancien mot de passe incorrect');
    }

    // Hasher le nouveau mot de passe
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
  }

  async resetPassword(email: string, newPassword: string): Promise<void> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    // Hasher le nouveau mot de passe
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
  }

  private generateToken(user: UserDocument): string {
    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
    };

    return this.jwtService.sign(payload);
  }
}
