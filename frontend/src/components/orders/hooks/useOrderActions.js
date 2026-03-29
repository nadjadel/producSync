import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from "sonner";

export const useOrderActions = () => {
  const queryClient = useQueryClient();

  // Mutation pour créer une commande avec génération automatique des OF
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Order.create(data),
    // Les OF sont générés automatiquement côté backend (orders.service.ts)
    // Ne pas en créer ici pour éviter la duplication
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] });
      toast.success('Commande créée + OF générés automatiquement');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la création de la commande: ${error.message}`);
    }
  });

  // Mutation pour mettre à jour une commande
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Commande mise à jour');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la mise à jour de la commande: ${error.message}`);
    }
  });

  // Mutation pour supprimer une commande
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Order.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Commande supprimée');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression de la commande: ${error.message}`);
    }
  });

  // Actions pour changer le statut
  const confirmOrder = (orderId) => {
    updateMutation.mutate({ id: orderId, data: { status: 'confirmed' } });
  };

  const markInProduction = (orderId) => {
    updateMutation.mutate({ id: orderId, data: { status: 'in_production' } });
  };

  const markReady = (orderId) => {
    updateMutation.mutate({ id: orderId, data: { status: 'ready' } });
  };

  const markDelivered = (orderId) => {
    updateMutation.mutate({ id: orderId, data: { status: 'delivered' } });
  };

  const cancelOrder = (orderId) => {
    updateMutation.mutate({ id: orderId, data: { status: 'cancelled' } });
  };

  // Action pour supprimer une commande avec confirmation
  const deleteOrder = (order) => {
    if (confirm(`Supprimer la commande "${order.order_number}" ?`)) {
      deleteMutation.mutate(order.id || order._id);
    }
  };

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    confirmOrder,
    markInProduction,
    markReady,
    markDelivered,
    cancelOrder,
    deleteOrder,
    isLoading: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
  };
};