import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Favorite extends Document {
    @Prop({ index: true })
    userId?: string;

    @Prop({ index: true })
    guestId?: string;

    @Prop({ required: true, index: true })
    tourId: number;
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);
FavoriteSchema.index({ userId: 1, guestId: 1, tourId: 1 }, { unique: true });
