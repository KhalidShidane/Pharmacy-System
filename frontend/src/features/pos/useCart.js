import { useMemo, useReducer } from 'react';

function reducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const existing = state.find((i) => i.medicineId === action.medicine._id);
      if (existing) {
        return state.map((i) =>
          i.medicineId === action.medicine._id
            ? { ...i, quantity: Math.min(i.quantity + 1, action.medicine.currentStock) }
            : i
        );
      }
      if (action.medicine.currentStock <= 0) return state;
      return [
        ...state,
        {
          medicineId: action.medicine._id,
          name: action.medicine.name,
          unit: action.medicine.unit,
          unitPrice: action.medicine.sellingPrice,
          availableStock: action.medicine.currentStock,
          quantity: 1,
          discount: 0,
        },
      ];
    }
    case 'SET_QUANTITY':
      return state.map((i) =>
        i.medicineId === action.medicineId
          ? { ...i, quantity: Math.max(1, Math.min(action.quantity, i.availableStock)) }
          : i
      );
    case 'SET_DISCOUNT':
      return state.map((i) => (i.medicineId === action.medicineId ? { ...i, discount: Math.max(0, action.discount) } : i));
    case 'REMOVE':
      return state.filter((i) => i.medicineId !== action.medicineId);
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

export function useCart() {
  const [items, dispatch] = useReducer(reducer, []);

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.unitPrice * i.quantity - i.discount, 0), [items]);
  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  return {
    items,
    subtotal,
    itemCount,
    addItem: (medicine) => dispatch({ type: 'ADD', medicine }),
    setQuantity: (medicineId, quantity) => dispatch({ type: 'SET_QUANTITY', medicineId, quantity }),
    setDiscount: (medicineId, discount) => dispatch({ type: 'SET_DISCOUNT', medicineId, discount }),
    removeItem: (medicineId) => dispatch({ type: 'REMOVE', medicineId }),
    clear: () => dispatch({ type: 'CLEAR' }),
  };
}
