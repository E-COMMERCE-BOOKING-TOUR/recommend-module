import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Favorite, FavoriteSchema } from './schemas/favorite.schema';
import { Interaction, InteractionSchema } from './schemas/interaction.schema';
import { TransformationService } from './transformation.service';
import { RecommendService } from './recommend.service';
import { RecommendController } from './recommend.controller';

@Module({
    imports: [
        ConfigModule.forRoot(),
        MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/recommend'),
        MongooseModule.forFeature([
            { name: Favorite.name, schema: FavoriteSchema },
            { name: Interaction.name, schema: InteractionSchema },
        ]),
    ],
    controllers: [RecommendController],
    providers: [TransformationService, RecommendService],
})
export class AppModule { }
