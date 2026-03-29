import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from "sonner";

export const useQuoteActions = () => {
  const queryClient = useQueryClient();

  // Mutation pour créer un devis
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Quote.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Devis créé');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la création du devis: ${error.message}`);
    }
  });

  // Mutation pour mettre à jour un devis
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Quote.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Devis mis à jour');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la mise à jour du devis: ${error.message}`);
    }
  });

  // Mutation pour supprimer un devis
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Quote.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Devis supprimé');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression du devis: ${error.message}`);
    }
  });

  // Mutation pour convertir un devis en commande
  const convertToOrderMutation = useMutation({
    mutationFn: async (quote) => {
      // Le numéro CO est généré par le backend
      const cleanItems = (quote.items || []).map(({ total, _id, ...item }) => item);

      const order = await base44.entities.Order.create({
        customer_id: quote.customer_id,
        customer_name: quote.customer_name,
        status: 'draft',
        order_date: new Date().toISOString().slice(0, 10),
        items: cleanItems,
      });

      const quoteId = quote.id || quote._id;
      const orderId = order.id || order._id;

      await base44.entities.Quote.update(quoteId, {
        status: 'accepted',
        order_id: orderId
      });

      // Créer des ordres de fabrication pour chaque ligne (numéros OF générés par le backend)
      const ofPromises = (quote.items || []).map(item =>
        base44.entities.ManufacturingOrder.create({
          customer_order_id: orderId,
          customer_order_number: order.order_number,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity_planned: item.quantity,
          quantity_produced: 0,
          status: 'draft',
          priority: 'medium',
          ready_for_delivery: false
        })
      );

      await Promise.all(ofPromises);
      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] });
      toast.success('Devis converti en commande + OF créés');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la conversion du devis: ${error.message}`);
    }
  });

  // Action pour envoyer un devis (changer le statut à 'sent')
  const sendQuote = (quoteId) => {
    updateMutation.mutate({ id: quoteId, data: { status: 'sent' } });
  };

  // Action pour refuser un devis (changer le statut à 'rejected')
  const rejectQuote = (quoteId) => {
    updateMutation.mutate({ id: quoteId, data: { status: 'rejected' } });
  };

  // Action pour accepter un devis (changer le statut à 'accepted')
  const acceptQuote = (quoteId) => {
    updateMutation.mutate({ id: quoteId, data: { status: 'accepted' } });
  };

  // Action pour supprimer un devis avec confirmation
  const deleteQuote = (quote) => {
    if (confirm(`Supprimer le devis "${quote.quote_number}" ?`)) {
      deleteMutation.mutate(quote.id);
    }
  };

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    convertToOrderMutation,
    sendQuote,
    rejectQuote,
    acceptQuote,
    deleteQuote,
    isLoading: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || convertToOrderMutation.isPending
  };
};