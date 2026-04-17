import { Request, Response } from 'express';
import { webhooksService } from '../services/webhooks.service';

export class WebhooksController {
  // ==================== WEBHOOK ENDPOINTS ====================

  async createWebhookEndpoint(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { url, description, subscribedEvents, organizationId, maxRequestsPerMinute, maxRetries, retryDelaySeconds, metadata } = req.body;

      if (!url || !subscribedEvents || subscribedEvents.length === 0) {
        res.status(400).json({
          success: false,
          message: 'url and subscribedEvents are required'
        });
        return;
      }

      const endpoint = await webhooksService.createWebhookEndpoint({
        userId,
        organizationId,
        url,
        description,
        subscribedEvents,
        maxRequestsPerMinute,
        maxRetries,
        retryDelaySeconds,
        metadata
      });

      res.status(201).json({
        success: true,
        data: endpoint,
        message: 'Webhook endpoint created successfully'
      });
    } catch (error: any) {
      console.error('[createWebhookEndpoint] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getWebhookEndpoints(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { organizationId } = req.query;

      const endpoints = await webhooksService.getWebhookEndpoints(
        userId,
        organizationId as string
      );

      res.json({
        success: true,
        data: endpoints
      });
    } catch (error: any) {
      console.error('[getWebhookEndpoints] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getWebhookEndpoint(req: Request, res: Response): Promise<void> {
    try {
      const { endpointId } = req.params;

      const endpoint = await webhooksService.getWebhookEndpoint(endpointId);

      if (!endpoint) {
        res.status(404).json({
          success: false,
          message: 'Webhook endpoint not found'
        });
        return;
      }

      res.json({
        success: true,
        data: endpoint
      });
    } catch (error: any) {
      console.error('[getWebhookEndpoint] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateWebhookEndpoint(req: Request, res: Response): Promise<void> {
    try {
      const { endpointId } = req.params;
      const updates = req.body;

      const endpoint = await webhooksService.updateWebhookEndpoint(endpointId, updates);

      res.json({
        success: true,
        data: endpoint,
        message: 'Webhook endpoint updated successfully'
      });
    } catch (error: any) {
      console.error('[updateWebhookEndpoint] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteWebhookEndpoint(req: Request, res: Response): Promise<void> {
    try {
      const { endpointId } = req.params;

      await webhooksService.deleteWebhookEndpoint(endpointId);

      res.json({
        success: true,
        message: 'Webhook endpoint deleted successfully'
      });
    } catch (error: any) {
      console.error('[deleteWebhookEndpoint] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async enableWebhookEndpoint(req: Request, res: Response): Promise<void> {
    try {
      const { endpointId } = req.params;

      const endpoint = await webhooksService.enableWebhookEndpoint(endpointId);

      res.json({
        success: true,
        data: endpoint,
        message: 'Webhook endpoint enabled'
      });
    } catch (error: any) {
      console.error('[enableWebhookEndpoint] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async disableWebhookEndpoint(req: Request, res: Response): Promise<void> {
    try {
      const { endpointId } = req.params;

      const endpoint = await webhooksService.disableWebhookEndpoint(endpointId);

      res.json({
        success: true,
        data: endpoint,
        message: 'Webhook endpoint disabled'
      });
    } catch (error: any) {
      console.error('[disableWebhookEndpoint] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async rotateWebhookSecret(req: Request, res: Response): Promise<void> {
    try {
      const { endpointId } = req.params;

      const endpoint = await webhooksService.rotateWebhookSecret(endpointId);

      res.json({
        success: true,
        data: endpoint,
        message: 'Webhook secret rotated successfully'
      });
    } catch (error: any) {
      console.error('[rotateWebhookSecret] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getWebhookEndpointHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await webhooksService.getWebhookEndpointHealth();

      res.json({
        success: true,
        data: health
      });
    } catch (error: any) {
      console.error('[getWebhookEndpointHealth] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ==================== WEBHOOK EVENTS ====================

  async publishEvent(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { eventType, payload, sourceEntityType, sourceEntityId, idempotencyKey } = req.body;

      if (!eventType || !payload) {
        res.status(400).json({
          success: false,
          message: 'eventType and payload are required'
        });
        return;
      }

      const eventId = await webhooksService.publishEvent({
        eventType,
        payload,
        sourceEntityType,
        sourceEntityId,
        triggeredBy: userId,
        idempotencyKey
      });

      res.status(201).json({
        success: true,
        data: { eventId },
        message: 'Event published successfully'
      });
    } catch (error: any) {
      console.error('[publishEvent] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getWebhookEvents(req: Request, res: Response): Promise<void> {
    try {
      const { eventType, status, sourceEntityType, sourceEntityId, limit, offset } = req.query;

      const events = await webhooksService.getWebhookEvents({
        eventType: eventType as string,
        status: status as string,
        sourceEntityType: sourceEntityType as string,
        sourceEntityId: sourceEntityId as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined
      });

      res.json({
        success: true,
        data: events
      });
    } catch (error: any) {
      console.error('[getWebhookEvents] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getWebhookEvent(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;

      const event = await webhooksService.getWebhookEvent(eventId);

      if (!event) {
        res.status(404).json({
          success: false,
          message: 'Event not found'
        });
        return;
      }

      res.json({
        success: true,
        data: event
      });
    } catch (error: any) {
      console.error('[getWebhookEvent] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getRecentWebhookEvents(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

      const events = await webhooksService.getRecentWebhookEvents(limit);

      res.json({
        success: true,
        data: events
      });
    } catch (error: any) {
      console.error('[getRecentWebhookEvents] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ==================== WEBHOOK DELIVERIES ====================

  async getWebhookDeliveries(req: Request, res: Response): Promise<void> {
    try {
      const { webhookEndpointId, webhookEventId, status, limit, offset } = req.query;

      const deliveries = await webhooksService.getWebhookDeliveries({
        webhookEndpointId: webhookEndpointId as string,
        webhookEventId: webhookEventId as string,
        status: status as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined
      });

      res.json({
        success: true,
        data: deliveries
      });
    } catch (error: any) {
      console.error('[getWebhookDeliveries] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getWebhookDelivery(req: Request, res: Response): Promise<void> {
    try {
      const { deliveryId } = req.params;

      const delivery = await webhooksService.getWebhookDelivery(deliveryId);

      if (!delivery) {
        res.status(404).json({
          success: false,
          message: 'Delivery not found'
        });
        return;
      }

      res.json({
        success: true,
        data: delivery
      });
    } catch (error: any) {
      console.error('[getWebhookDelivery] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getPendingDeliveries(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

      const deliveries = await webhooksService.getPendingDeliveries(limit);

      res.json({
        success: true,
        data: deliveries
      });
    } catch (error: any) {
      console.error('[getPendingDeliveries] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getFailedDeliveries(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

      const deliveries = await webhooksService.getFailedDeliveries(limit);

      res.json({
        success: true,
        data: deliveries
      });
    } catch (error: any) {
      console.error('[getFailedDeliveries] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async retryDelivery(req: Request, res: Response): Promise<void> {
    try {
      const { deliveryId } = req.params;

      const delivery = await webhooksService.retryDelivery(deliveryId);

      res.json({
        success: true,
        data: delivery,
        message: 'Delivery scheduled for retry'
      });
    } catch (error: any) {
      console.error('[retryDelivery] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ==================== EVENT SUBSCRIPTIONS ====================

  async createEventSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { subscriberType, subscriberId, eventTypes, entityTypeFilter, filterConditions, priority } = req.body;

      if (!subscriberType || !eventTypes || eventTypes.length === 0) {
        res.status(400).json({
          success: false,
          message: 'subscriberType and eventTypes are required'
        });
        return;
      }

      const subscription = await webhooksService.createEventSubscription({
        subscriberType,
        subscriberId,
        eventTypes,
        entityTypeFilter,
        filterConditions,
        priority
      });

      res.status(201).json({
        success: true,
        data: subscription,
        message: 'Event subscription created'
      });
    } catch (error: any) {
      console.error('[createEventSubscription] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getEventSubscriptions(req: Request, res: Response): Promise<void> {
    try {
      const { subscriberType } = req.query;

      const subscriptions = await webhooksService.getEventSubscriptions(subscriberType as string);

      res.json({
        success: true,
        data: subscriptions
      });
    } catch (error: any) {
      console.error('[getEventSubscriptions] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteEventSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { subscriptionId } = req.params;

      await webhooksService.deleteEventSubscription(subscriptionId);

      res.json({
        success: true,
        message: 'Event subscription deleted'
      });
    } catch (error: any) {
      console.error('[deleteEventSubscription] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ==================== EVENT HANDLERS ====================

  async createEventHandler(req: Request, res: Response): Promise<void> {
    try {
      const { handlerName, handlerType, description, eventTypes, handlerFunction, timeoutSeconds } = req.body;

      if (!handlerName || !handlerType || !eventTypes || !handlerFunction) {
        res.status(400).json({
          success: false,
          message: 'handlerName, handlerType, eventTypes, and handlerFunction are required'
        });
        return;
      }

      const handler = await webhooksService.createEventHandler({
        handlerName,
        handlerType,
        description,
        eventTypes,
        handlerFunction,
        timeoutSeconds
      });

      res.status(201).json({
        success: true,
        data: handler,
        message: 'Event handler created'
      });
    } catch (error: any) {
      console.error('[createEventHandler] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getEventHandlers(req: Request, res: Response): Promise<void> {
    try {
      const { eventType } = req.query;

      const handlers = await webhooksService.getEventHandlers(eventType as string);

      res.json({
        success: true,
        data: handlers
      });
    } catch (error: any) {
      console.error('[getEventHandlers] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ==================== WEBHOOK LOGS ====================

  async getWebhookLogs(req: Request, res: Response): Promise<void> {
    try {
      const { webhookEndpointId, webhookDeliveryId, logLevel, limit } = req.query;

      const logs = await webhooksService.getWebhookLogs({
        webhookEndpointId: webhookEndpointId as string,
        webhookDeliveryId: webhookDeliveryId as string,
        logLevel: logLevel as string,
        limit: limit ? parseInt(limit as string, 10) : undefined
      });

      res.json({
        success: true,
        data: logs
      });
    } catch (error: any) {
      console.error('[getWebhookLogs] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ==================== EVENT REPLAY ====================

  async createEventReplay(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { eventIds, webhookEndpointIds, reason } = req.body;

      if (!eventIds || eventIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'eventIds array is required'
        });
        return;
      }

      const replay = await webhooksService.createEventReplay({
        eventIds,
        webhookEndpointIds,
        requestedBy: userId,
        reason
      });

      res.status(201).json({
        success: true,
        data: replay,
        message: 'Event replay queued'
      });
    } catch (error: any) {
      console.error('[createEventReplay] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getEventReplays(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      const replays = await webhooksService.getEventReplays(userId);

      res.json({
        success: true,
        data: replays
      });
    } catch (error: any) {
      console.error('[getEventReplays] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ==================== STATISTICS ====================

  async getWebhookStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { webhookEndpointId } = req.query;

      const stats = await webhooksService.getWebhookStatistics(webhookEndpointId as string);

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('[getWebhookStatistics] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getEventStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { eventType } = req.query;

      const stats = await webhooksService.getEventStatistics(eventType as string);

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('[getEventStatistics] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export const webhooksController = new WebhooksController();
