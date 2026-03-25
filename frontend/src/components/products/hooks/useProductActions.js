import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from "sonner";

export const useProductActions = () => {
  const queryClient = useQueryClient();

  // Mutation pour créer un produit
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produit créé');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la création du produit: ${error.message}`);
    }
  });

  // Mutation pour mettre à jour un produit
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produit mis à jour');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la mise à jour du produit: ${error.message}`);
    }
  });

  // Mutation pour supprimer un produit
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produit supprimé');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression du produit: ${error.message}`);
    }
  });

  // Action pour supprimer un produit avec confirmation
  const deleteProduct = (product) => {
    if (confirm(`Supprimer "${product.name}" ?`)) {
      deleteMutation.mutate(product.id);
    }
  };

  // Action pour mettre à jour le stock
  const updateStock = (productId, newStockQuantity) => {
    updateMutation.mutate({ 
      id: productId, 
      data: { stock_quantity: newStockQuantity } 
    });
  };

  // Action pour activer/désactiver un produit
  const toggleProductStatus = (product) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    updateMutation.mutate({ 
      id: product.id, 
      data: { status: newStatus } 
    });
  };

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    deleteProduct,
    updateStock,
    toggleProductStatus,
    isLoading: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
  };
};