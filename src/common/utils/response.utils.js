export const SuccessResponseHandling = ({
  res,
  status = 200,
  message = "Done",
  data = undefined,
} = {}) => {
  return res.status(status).json({ status_code: status, message, data });
};
