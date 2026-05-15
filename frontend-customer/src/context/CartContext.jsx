import { createContext, useContext, useReducer } from 'react';

const CartContext = createContext(null);

function reducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find(i => i.id === action.item.id);
      if (existing) {
        return { ...state, items: state.items.map(i => i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i) };
      }
      if (state.storeSlug && state.storeSlug !== action.storeSlug) {
        return { storeSlug: action.storeSlug, items: [{ ...action.item, qty: 1 }] };
      }
      return { storeSlug: action.storeSlug, items: [...state.items, { ...action.item, qty: 1 }] };
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter(i => i.id !== action.id) };
    case 'SET_QTY': {
      if (action.qty <= 0) return { ...state, items: state.items.filter(i => i.id !== action.id) };
      return { ...state, items: state.items.map(i => i.id === action.id ? { ...i, qty: action.qty } : i) };
    }
    case 'CLEAR':
      return { storeSlug: null, items: [] };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(reducer, { storeSlug: null, items: [] });

  const totalItems = cart.items.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.items.reduce((s, i) => s + i.displayPrice * i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, dispatch, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
