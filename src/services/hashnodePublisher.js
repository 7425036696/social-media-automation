import 'dotenv/config';
import { logger } from '../utils/logger.js';

export class HashnodePublisher {
  constructor() {
    this.apiToken = process.env.HASHNODE_API_TOKEN;
    this.publicationId = process.env.HASHNODE_PUBLICATION_ID;
    this.apiUrl = 'https://gql.hashnode.com';
    
    if (!this.apiToken) {
      throw new Error('HASHNODE_API_TOKEN is required');
    }
    
    if (!this.publicationId) {
      throw new Error('HASHNODE_PUBLICATION_ID is required');
    }

    // Validate publication ID format (should be 24 characters)
    if (this.publicationId.length !== 24 || !/^[0-9a-fA-F]+$/.test(this.publicationId)) {
      throw new Error(`Invalid HASHNODE_PUBLICATION_ID format: ${this.publicationId}. Should be 24 hex characters.`);
    }

    logger.info('✅ Hashnode API client initialized');
  }

  // Convert string tags to Hashnode tag format
  formatTags(tags) {
    if (!Array.isArray(tags)) return [];
    
    return tags.map(tag => {
      if (typeof tag === 'string') {
        return {
          slug: tag.toLowerCase().replace(/[^a-z0-9-]/g, ''),
          name: tag.charAt(0).toUpperCase() + tag.slice(1)
        };
      }
      return tag;
    }).filter(tag => tag.slug && tag.slug.length > 0);
  }

  // Extract tags from content
  extractTagsFromContent(content) {
    const tagMatches = content.match(/TAGS:\s*([^\n]+)/i);
    if (tagMatches) {
      return tagMatches[1].split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
    return ['ai', 'technology', 'innovation'];
  }

  async publishPost(blogPost) {
    try {
      const { title, content, tags: rawTags } = blogPost;
      
      if (!title || !content) {
        throw new Error('Title and content are required for blog post');
      }

      // Extract tags from content if not provided
      const tagsToUse = rawTags || this.extractTagsFromContent(content);
      const formattedTags = this.formatTags(tagsToUse);

      logger.info('📝 Publishing to Hashnode:');
      logger.info(`Title: ${title}`);
      logger.info(`Content length: ${content.length}`);
      logger.info(`Tags: ${JSON.stringify(formattedTags)}`);
      logger.info(`Publication ID: ${this.publicationId}`);

      const mutation = `
        mutation PublishPost($input: PublishPostInput!) {
          publishPost(input: $input) {
            post {
              id
              title
              url
              slug
            }
          }
        }
      `;

      const variables = {
        input: {
          title: title.substring(0, 100), // Limit title length
          contentMarkdown: content,
          tags: formattedTags,
          publicationId: this.publicationId
          // Removed deprecated fields: hideFromHashnodeFeed, enableTableOfContent
        }
      };

      logger.info('GraphQL Variables:', JSON.stringify(variables, null, 2));

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.apiToken,
        },
        body: JSON.stringify({
          query: mutation,
          variables: variables
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        logger.error('Hashnode API errors:', result.errors);
        throw new Error(`Hashnode API errors: ${JSON.stringify(result.errors)}`);
      }

      if (result.data && result.data.publishPost) {
        const post = result.data.publishPost.post;
        logger.info('✅ Successfully published to Hashnode:', post.url);
        
        return {
          success: true,
          message: 'Blog post published successfully',
          data: post
        };
      } else {
        throw new Error('Unexpected response format from Hashnode API');
      }

    } catch (error) {
      logger.error('❌ Hashnode publishing failed:', error.message);
      throw error;
    }
  }

  // Test method to validate publication ID
  async testPublicationId() {
    try {
      const query = `
        query GetPublication($id: ObjectId!) {
          publication(id: $id) {
            id
            title
            displayTitle
            url
          }
        }
      `;

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.apiToken,
        },
        body: JSON.stringify({
          query: query,
          variables: { id: this.publicationId }
        }),
      });

      const result = await response.json();
      
      if (result.errors) {
        logger.error('Publication ID test failed:', result.errors);
        return false;
      }

      if (result.data && result.data.publication) {
        logger.info('✅ Publication found:', result.data.publication.title);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('❌ Publication ID test error:', error.message);
      return false;
    }
  }
}