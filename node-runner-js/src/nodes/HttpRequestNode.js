module.exports = async (input, node) => {
  const { url, method, headers, body } = node.data;

  try {
    const response = await axios({
      url,
      method,
      headers,
      data: body,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
