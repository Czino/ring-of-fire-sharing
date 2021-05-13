export const changeView = (state, view, ring) => ({
  ...state,
  view,
  route: null,
  invoice: null,
  paymentStatus: null,
  ringCache: null,
  ring
})