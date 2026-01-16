"""
客户端检测路由
用于判断访问来源是否为本机
"""

from flask import Blueprint, request, jsonify

client_bp = Blueprint('client', __name__)


def is_local_request():
    """判断请求是否来自本机"""
    remote_addr = request.remote_addr
    # 本机访问的IP地址
    local_ips = ['127.0.0.1', '::1', 'localhost']
    return remote_addr in local_ips


@client_bp.route('/api/client/info', methods=['GET'])
def get_client_info():
    """获取客户端信息
    
    返回:
    - is_local: 是否为本机访问
    - client_ip: 客户端IP地址
    """
    remote_addr = request.remote_addr
    is_local = is_local_request()
    
    return jsonify({
        "success": True,
        "is_local": is_local,
        "client_ip": remote_addr
    })
