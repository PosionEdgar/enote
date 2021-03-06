function userModel (opts) {
  return {
    local_name: opts.local_name || '',
    username: opts.username || '',
    usercode: opts.usercode || '',
    password: opts.password || '',
    oa_id: opts.oa_id || '',
    account_name_cn: opts.account_name_cn || '',
    image_url: opts.image_url || '',
    position_id: opts.position_id || '',
    position_name: opts.position_name || '',
    department_id: opts.department_id || '',
    department_name: opts.department_name || '',
    friend_list: opts.friend_list || [],
    is_sync: opts.is_sync || false,
    access_token: opts.access_token || '',
    id_token: opts.id_token || ''
  }
}

export default userModel
