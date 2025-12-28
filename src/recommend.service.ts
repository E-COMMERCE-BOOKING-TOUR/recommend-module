import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Favorite } from './schemas/favorite.schema';
import { Interaction } from './schemas/interaction.schema';
import { TransformationService } from './transformation.service';

@Injectable()
export class RecommendService {
    constructor(
        @InjectModel(Favorite.name) private favoriteModel: Model<Favorite>,
        @InjectModel(Interaction.name) private interactionModel: Model<Interaction>,
        private transformationService: TransformationService,
    ) { }

    async trackInteraction(data: {
        userId?: string;
        guestId?: string;
        tourId: number;
        type: string;
        metadata?: any;
    }) {
        const interaction = new this.interactionModel(data);
        await interaction.save();
        return interaction;
    }

    async toggleFavorite(data: { userId?: string; guestId?: string; tourId: number }) {
        const existing = await this.favoriteModel.findOne(data);
        if (existing) {
            await existing.deleteOne();
            return { favorited: false };
        } else {
            const favorite = new this.favoriteModel(data);
            await favorite.save();
            return { favorited: true };
        }
    }

    async mergeGuestData(guestId: string, userId: string) {
        // Merge favorites
        const guestFavorites = await this.favoriteModel.find({ guestId });
        for (const fav of guestFavorites) {
            const exists = await this.favoriteModel.findOne({ userId, tourId: fav.tourId });
            if (!exists) {
                await this.favoriteModel.updateOne(
                    { _id: fav._id },
                    { $set: { userId }, $unset: { guestId: 1 } },
                );
            } else {
                await fav.deleteOne();
            }
        }

        // Merge interactions
        await this.interactionModel.updateMany({ guestId }, { $set: { userId }, $unset: { guestId: 1 } });
    }

    async getUserInteractedTourIds(userId?: string, guestId?: string): Promise<number[]> {
        const query = userId ? { userId } : { guestId };
        const interactions = await this.interactionModel
            .find(query)
            .sort({ createdAt: -1 })
            .limit(20)
            .select('tourId');
        return [...new Set(interactions.map((i) => i.tourId))];
    }

    async getUserFavorites(userId?: string, guestId?: string): Promise<number[]> {
        const query = userId ? { userId } : { guestId };
        const favorites = await this.favoriteModel.find(query).select('tourId');
        return favorites.map((f) => f.tourId);
    }

    calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
        if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
        let dotProduct = 0;
        let mA = 0;
        let mB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            mA += vecA[i] * vecA[i];
            mB += vecB[i] * vecB[i];
        }
        mA = Math.sqrt(mA);
        mB = Math.sqrt(mB);
        if (mA === 0 || mB === 0) return 0;
        return dotProduct / (mA * mB);
    }
}
