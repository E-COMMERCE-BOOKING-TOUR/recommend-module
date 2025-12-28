import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TransformationService {
    private readonly aiServiceUrl: string;

    constructor(private configService: ConfigService) {
        const host = this.configService.get<string>('AI_SERVICE_HOST', 'python-ai-service');
        const port = this.configService.get<string>('AI_SERVICE_PORT', '8000');
        this.aiServiceUrl = `http://${host}:${port}`;
    }

    async generateFusedVector(data: {
        title: string;
        description: string;
        summary: string;
        address: string;
        imageUrls: string[];
        price: number;
        durationDays: number;
    }): Promise<{ vector: number[]; insights: any }> {
        try {
            const response = await axios.post(`${this.aiServiceUrl}/v1/embeddings/fuse`, {
                title: data.title,
                description: data.description,
                summary: data.summary,
                address: data.address,
                image_urls: data.imageUrls,
                price: data.price,
                duration_days: data.durationDays,
                // These global min/max could be fetched from DB or set as constants
                min_price_global: 0,
                max_price_global: 100000000,
                max_duration_global: 30
            });
            return response.data;
        } catch (error) {
            console.error('Error calling Python AI service:', error.message);
            throw error;
        }
    }

    // Keep these for standalone calls if needed, but updated to call Python
    async generateTextEmbedding(text: string): Promise<number[]> {
        // We could implement a specific endpoint in Python for this
        // For now, this service will primarily use the fused endpoint
        return [];
    }

    normalizeNumeric(value: number, min: number, max: number): number {
        if (max === min) return 0;
        return (value - min) / (max - min);
    }

    fuseVectors(textVector: number[], imageVector: number[], structuredFeatures: number[]): number[] {
        return [...textVector, ...imageVector, ...structuredFeatures];
    }
}
