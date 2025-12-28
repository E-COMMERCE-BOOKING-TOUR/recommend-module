import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RecommendService } from './recommend.service';
import { TransformationService } from './transformation.service';

@Controller()
export class RecommendController {
    constructor(
        private readonly recommendService: RecommendService,
        private readonly transformationService: TransformationService
    ) { }

    @MessagePattern({ cmd: 'track_interaction' })
    async trackInteraction(@Payload() data: any) {
        return this.recommendService.trackInteraction(data);
    }

    @MessagePattern({ cmd: 'toggle_favorite' })
    async toggleFavorite(@Payload() data: any) {
        return this.recommendService.toggleFavorite(data);
    }

    @MessagePattern({ cmd: 'merge_guest_data' })
    async mergeGuestData(@Payload() data: { guestId: string; userId: string }) {
        await this.recommendService.mergeGuestData(data.guestId, data.userId);
        return { success: true };
    }

    @MessagePattern({ cmd: 'get_user_behavior' })
    async getUserBehavior(@Payload() data: { userId?: string; guestId?: string }) {
        const tourIds = await this.recommendService.getUserInteractedTourIds(data.userId, data.guestId);
        const favoriteIds = await this.recommendService.getUserFavorites(data.userId, data.guestId);
        return { interactedTourIds: tourIds, favoriteTourIds: favoriteIds };
    }

    @MessagePattern({ cmd: 'calculate_recommendations' })
    async calculateRecommendations(
        @Payload() data: {
            userInteractedVectors: number[][],
            candidateTours: { id: number, vector: number[] }[]
        }
    ) {
        if (!data.userInteractedVectors || data.userInteractedVectors.length === 0) {
            return [];
        }

        // Calculate profile vector (average)
        const dim = data.userInteractedVectors[0].length;
        const profileVector = new Array(dim).fill(0);
        for (const vec of data.userInteractedVectors) {
            for (let i = 0; i < dim; i++) {
                profileVector[i] += vec[i];
            }
        }
        for (let i = 0; i < dim; i++) {
            profileVector[i] /= data.userInteractedVectors.length;
        }

        // Rank candidates
        const scored = data.candidateTours.map(tour => ({
            id: tour.id,
            score: this.recommendService.calculateCosineSimilarity(profileVector, tour.vector)
        }));

        return scored.sort((a, b) => b.score - a.score).slice(0, 10);
    }

    @MessagePattern({ cmd: 'generate_tour_vector' })
    async generateTourVector(
        @Payload() data: {
            title: string;
            description: string;
            summary: string;
            address: string;
            imageUrls: string[];
            numeric: { price: number; duration_days: number };
        }
    ) {
        const result = await this.transformationService.generateFusedVector({
            title: data.title,
            description: data.description,
            summary: data.summary,
            address: data.address,
            imageUrls: data.imageUrls,
            price: data.numeric.price,
            durationDays: data.numeric.duration_days,
        });

        return { vector: result.vector, insights: result.insights };
    }
}
