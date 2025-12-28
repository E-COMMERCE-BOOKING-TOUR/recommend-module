import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Interaction extends Document {
    @Prop({ index: true })
    userId?: string;

    @Prop({ index: true })
    guestId?: string;

    @Prop({ required: true, index: true })
    tourId: number;

    @Prop({ required: true, enum: ['view', 'like', 'search'] })
    type: string;

    @Prop({ type: Object })
    metadata?: any;
}

export const InteractionSchema = SchemaFactory.createForClass(Interaction);
InteractionSchema.index({ userId: 1, guestId: 1, tourId: 1, type: 1 });
