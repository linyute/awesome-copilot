#!/usr/bin/env python3
"""
Azure 互動式架構圖產生器 v3
使用 Azure 官方圖示（內嵌 Base64）產生互動式 HTML 圖表。
"""

import json
from datetime import datetime

from icons import get_icon_data_uri

_HAS_OFFICIAL_ICONS = True
# Azure 服務圖示：SVG、色彩與官方圖示鍵對應
# icon: 48x48 viewBox SVG 路徑（後備）
# azure_icon_key: icons.py 中的鍵（官方 Azure 圖示）
SERVICE_ICONS = {
    "openai": {
        "icon_svg": '<circle cx="24" cy="24" r="18" fill="#0078D4"/><text x="24" y="30" text-anchor="middle" font-size="18" fill="white" font-weight="700">AI</text>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "AI",
        "azure_icon_key": "azure_openai"
    },
    "ai_foundry": {
        "icon_svg": '<rect x="6" y="10" width="36" height="28" rx="4" fill="#0078D4"/><rect x="12" y="16" width="10" height="8" rx="2" fill="white" opacity="0.9"/><rect x="26" y="16" width="10" height="8" rx="2" fill="white" opacity="0.9"/><rect x="12" y="27" width="24" height="5" rx="2" fill="white" opacity="0.6"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "AI",
        "azure_icon_key": "ai_foundry"
    },
    "ai_hub": {
        "icon_svg": '<rect x="6" y="10" width="36" height="28" rx="4" fill="#0078D4"/><circle cx="24" cy="24" r="8" fill="white" opacity="0.9"/><circle cx="24" cy="24" r="4" fill="#0078D4"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "AI",
        "azure_icon_key": "machine_learning"
    },
    "search": {
        "icon_svg": '<circle cx="20" cy="20" r="12" fill="none" stroke="#0078D4" stroke-width="3.5"/><line x1="29" y1="29" x2="40" y2="40" stroke="#0078D4" stroke-width="3.5" stroke-linecap="round"/><circle cx="20" cy="20" r="5" fill="#0078D4" opacity="0.3"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "AI",
        "azure_icon_key": "cognitive_search"
    },
    "ai_search": {
        "icon_svg": '<circle cx="20" cy="20" r="12" fill="none" stroke="#0078D4" stroke-width="3.5"/><line x1="29" y1="29" x2="40" y2="40" stroke="#0078D4" stroke-width="3.5" stroke-linecap="round"/><circle cx="20" cy="20" r="5" fill="#0078D4" opacity="0.3"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "AI",
        "azure_icon_key": "cognitive_search"
    },
    "aml": {
        "icon_svg": '<rect x="6" y="8" width="36" height="32" rx="4" fill="#0078D4"/><path d="M14 32 L20 18 L26 26 L32 14" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "AI",
        "azure_icon_key": "machine_learning"
    },
    "storage": {
        "icon_svg": '<rect x="8" y="8" width="32" height="8" rx="3" fill="#0078D4"/><rect x="8" y="20" width="32" height="8" rx="3" fill="#0078D4" opacity="0.7"/><rect x="8" y="32" width="32" height="8" rx="3" fill="#0078D4" opacity="0.4"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Data",
        "azure_icon_key": "storage_accounts"
    },
    "adls": {
        "icon_svg": '<rect x="8" y="8" width="32" height="8" rx="3" fill="#0078D4"/><rect x="8" y="20" width="32" height="8" rx="3" fill="#0078D4" opacity="0.7"/><rect x="8" y="32" width="32" height="8" rx="3" fill="#0078D4" opacity="0.4"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Data",
        "azure_icon_key": "data_lake_storage_gen1"
    },
    "fabric": {
        "icon_svg": '<polygon points="24,6 42,18 42,34 24,46 6,34 6,18" fill="#E8740C" opacity="0.9"/><text x="24" y="30" text-anchor="middle" font-size="14" fill="white" font-weight="700">F</text>',
        "color": "#E8740C", "bg": "#FEF3E8", "category": "Data",
        "azure_icon_key": "microsoft_fabric"
    },
    "synapse": {
        "icon_svg": '<circle cx="24" cy="24" r="18" fill="#0078D4"/><path d="M15 24 L24 15 L33 24 L24 33 Z" fill="white" opacity="0.9"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Data",
        "azure_icon_key": "azure_synapse_analytics"
    },
    "adf": {
        "icon_svg": '<rect x="6" y="12" width="36" height="24" rx="4" fill="#0078D4"/><path d="M16 24 L28 24 M24 18 L30 24 L24 30" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Data",
        "azure_icon_key": "data_factory"
    },
    "data_factory": {
        "icon_svg": '<rect x="6" y="12" width="36" height="24" rx="4" fill="#0078D4"/><path d="M16 24 L28 24 M24 18 L30 24 L24 30" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Data",
        "azure_icon_key": "data_factory"
    },
    "keyvault": {
        "icon_svg": '<rect x="10" y="6" width="28" height="36" rx="4" fill="#E8A000"/><circle cx="24" cy="22" r="6" fill="white"/><rect x="22" y="26" width="4" height="10" rx="1" fill="white"/>',
        "color": "#E8A000", "bg": "#FEF7E0", "category": "Security",
        "azure_icon_key": "key_vaults"
    },
    "kv": {
        "icon_svg": '<rect x="10" y="6" width="28" height="36" rx="4" fill="#E8A000"/><circle cx="24" cy="22" r="6" fill="white"/><rect x="22" y="26" width="4" height="10" rx="1" fill="white"/>',
        "color": "#E8A000", "bg": "#FEF7E0", "category": "Security",
        "azure_icon_key": "key_vaults"
    },
    "vnet": {
        "icon_svg": '<rect x="6" y="6" width="36" height="36" rx="4" fill="none" stroke="#5C2D91" stroke-width="2.5"/><circle cx="16" cy="18" r="4" fill="#5C2D91"/><circle cx="32" cy="18" r="4" fill="#5C2D91"/><circle cx="24" cy="32" r="4" fill="#5C2D91"/><line x1="16" y1="18" x2="32" y2="18" stroke="#5C2D91" stroke-width="1.5"/><line x1="16" y1="18" x2="24" y2="32" stroke="#5C2D91" stroke-width="1.5"/><line x1="32" y1="18" x2="24" y2="32" stroke="#5C2D91" stroke-width="1.5"/>',
        "color": "#5C2D91", "bg": "#F3EEF9", "category": "Network",
        "azure_icon_key": "virtual_networks"
    },
    "pe": {
        "icon_svg": '<circle cx="24" cy="24" r="14" fill="none" stroke="#5C2D91" stroke-width="2"/><circle cx="24" cy="24" r="6" fill="#5C2D91"/><line x1="24" y1="10" x2="24" y2="4" stroke="#5C2D91" stroke-width="2"/><line x1="24" y1="38" x2="24" y2="44" stroke="#5C2D91" stroke-width="2"/>',
        "color": "#5C2D91", "bg": "#F3EEF9", "category": "Network",
        "azure_icon_key": "private_endpoints"
    },
    "nsg": {
        "icon_svg": '<rect x="8" y="8" width="32" height="32" rx="4" fill="#5C2D91"/><path d="M18 20 L24 14 L30 20 M18 28 L24 34 L30 28" stroke="white" stroke-width="2" fill="none"/>',
        "color": "#5C2D91", "bg": "#F3EEF9", "category": "Network",
        "azure_icon_key": "network_security_groups"
    },
    "acr": {
        "icon_svg": '<rect x="8" y="10" width="32" height="28" rx="4" fill="#0078D4"/><rect x="14" y="16" width="20" height="16" rx="2" fill="white" opacity="0.3"/><text x="24" y="30" text-anchor="middle" font-size="12" fill="white" font-weight="600">ACR</text>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Compute"
    },
    "aks": {
        "icon_svg": '<circle cx="24" cy="24" r="18" fill="#326CE5"/><text x="24" y="30" text-anchor="middle" font-size="16" fill="white" font-weight="700">K</text>',
        "color": "#326CE5", "bg": "#EBF0FC", "category": "Compute",
        "azure_icon_key": "kubernetes_services"
    },
    "appservice": {
        "icon_svg": '<rect x="8" y="8" width="32" height="32" rx="6" fill="#0078D4"/><polygon points="24,14 34,34 14,34" fill="white" opacity="0.9"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Compute",
        "azure_icon_key": "app_services"
    },
    "appinsights": {
        "icon_svg": '<circle cx="24" cy="24" r="16" fill="#773ADC"/><path d="M16 28 L20 20 L24 24 L28 16 L32 22" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>',
        "color": "#773ADC", "bg": "#F0EAFA", "category": "Monitor",
        "azure_icon_key": "application_insights"
    },
    "monitor": {
        "icon_svg": '<rect x="6" y="10" width="36" height="24" rx="4" fill="#773ADC"/><path d="M14 28 L20 20 L26 24 L34 16" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/><rect x="14" y="36" width="20" height="3" rx="1" fill="#773ADC" opacity="0.5"/>',
        "color": "#773ADC", "bg": "#F0EAFA", "category": "Monitor",
        "azure_icon_key": "monitor"
    },
    "vm": {
        "icon_svg": '<rect x="6" y="8" width="36" height="26" rx="3" fill="#0078D4"/><rect x="10" y="12" width="28" height="18" rx="1" fill="white" opacity="0.2"/><rect x="16" y="36" width="16" height="4" rx="1" fill="#0078D4"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Compute",
        "azure_icon_key": "virtual_machine"
    },
    "bastion": {
        "icon_svg": '<rect x="8" y="6" width="32" height="36" rx="4" fill="#5C2D91"/><rect x="14" y="12" width="20" height="14" rx="2" fill="white" opacity="0.3"/><circle cx="24" cy="34" r="4" fill="white" opacity="0.7"/>',
        "color": "#5C2D91", "bg": "#F3EEF9", "category": "Network",
        "azure_icon_key": "bastions"
    },
    "jumpbox": {
        "icon_svg": '<rect x="8" y="8" width="32" height="32" rx="4" fill="#5C2D91"/><text x="24" y="30" text-anchor="middle" font-size="14" fill="white" font-weight="600">JB</text>',
        "color": "#5C2D91", "bg": "#F3EEF9", "category": "Network",
        "azure_icon_key": "virtual_machine"
    },
    "vpn": {
        "icon_svg": '<rect x="6" y="12" width="36" height="24" rx="4" fill="#5C2D91"/><path d="M16 24 L24 16 L32 24 L24 32 Z" fill="white" opacity="0.8"/>',
        "color": "#5C2D91", "bg": "#F3EEF9", "category": "Network",
        "azure_icon_key": "virtual_network_gateways"
    },
    "user": {
        "icon_svg": '<circle cx="24" cy="16" r="8" fill="#0078D4"/><path d="M10 42 Q10 30 24 30 Q38 30 38 42" fill="#0078D4"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "External"
    },
    "app": {
        "icon_svg": '<rect x="8" y="6" width="32" height="36" rx="6" fill="#666"/><rect x="14" y="12" width="20" height="20" rx="2" fill="white" opacity="0.3"/><circle cx="24" cy="40" r="2" fill="white" opacity="0.7"/>',
        "color": "#666666", "bg": "#F5F5F5", "category": "External"
    },
    "default": {
        "icon_svg": '<circle cx="24" cy="24" r="16" fill="#0078D4"/><text x="24" y="30" text-anchor="middle" font-size="14" fill="white" font-weight="600">?</text>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Azure"
    },
    "cdn": {
        "icon_svg": '<circle cx="24" cy="24" r="18" fill="#0078D4"/><text x="24" y="28" text-anchor="middle" font-size="10" fill="white" font-weight="700">CDN</text>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Network",
        "azure_icon_key": "cdn_profiles"
    },
    "event_hub": {
        "icon_svg": '<rect x="6" y="6" width="36" height="36" rx="4" fill="#0078D4"/><text x="24" y="22" text-anchor="middle" font-size="8" fill="white" font-weight="700">Event</text><text x="24" y="33" text-anchor="middle" font-size="8" fill="white">Hub</text>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Integration",
        "azure_icon_key": "event_hubs"
    },
    "redis": {
        "icon_svg": '<rect x="6" y="6" width="36" height="36" rx="4" fill="#D83B01"/><text x="24" y="28" text-anchor="middle" font-size="10" fill="white" font-weight="700">Redis</text>',
        "color": "#D83B01", "bg": "#FEF0E8", "category": "Data",
        "azure_icon_key": "cache_redis"
    },
    "devops": {
        "icon_svg": '<rect x="6" y="6" width="36" height="36" rx="4" fill="#0078D4"/><text x="24" y="22" text-anchor="middle" font-size="8" fill="white" font-weight="700">Dev</text><text x="24" y="33" text-anchor="middle" font-size="8" fill="white">Ops</text>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "DevOps",
        "azure_icon_key": "azure_devops"
    },
    "acr": {
        "icon_svg": '<rect x="8" y="10" width="32" height="28" rx="4" fill="#0078D4"/><text x="24" y="28" text-anchor="middle" font-size="10" fill="white" font-weight="700">ACR</text>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Compute",
        "azure_icon_key": "container_registries"
    },
    "container_registry": {
        "icon_svg": '<rect x="8" y="10" width="32" height="28" rx="4" fill="#0078D4"/><text x="24" y="28" text-anchor="middle" font-size="10" fill="white" font-weight="700">ACR</text>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Compute",
        "azure_icon_key": "container_registries"
    },
    "app_gateway": {
        "icon_svg": '<rect x="6" y="6" width="36" height="36" rx="4" fill="#0078D4"/><text x="24" y="22" text-anchor="middle" font-size="8" fill="white" font-weight="700">App</text><text x="24" y="33" text-anchor="middle" font-size="8" fill="white">GW</text>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Network",
        "azure_icon_key": "application_gateways"
    },
    "iot_hub": {
        "icon_svg": '<rect x="6" y="6" width="36" height="36" rx="4" fill="#0078D4"/><text x="24" y="22" text-anchor="middle" font-size="8" fill="white" font-weight="700">IoT</text><text x="24" y="33" text-anchor="middle" font-size="8" fill="white">Hub</text>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "IoT",
        "azure_icon_key": "iot_hub"
    },
    "stream_analytics": {
        "icon_svg": '<rect x="6" y="6" width="36" height="36" rx="4" fill="#0078D4"/><text x="24" y="22" text-anchor="middle" font-size="7" fill="white" font-weight="700">Stream</text><text x="24" y="33" text-anchor="middle" font-size="7" fill="white">Analytics</text>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Data",
        "azure_icon_key": "stream_analytics_jobs"
    },
    "vpn_gateway": {
        "icon_svg": '<rect x="6" y="12" width="36" height="24" rx="4" fill="#5C2D91"/><path d="M16 24 L24 16 L32 24 L24 32 Z" fill="white" opacity="0.8"/>',
        "color": "#5C2D91", "bg": "#F3EEF9", "category": "Network",
        "azure_icon_key": "virtual_network_gateways"
    },
    "front_door": {
        "icon_svg": '<rect x="6" y="6" width="36" height="36" rx="4" fill="#0078D4"/><text x="24" y="22" text-anchor="middle" font-size="7" fill="white" font-weight="700">Front</text><text x="24" y="33" text-anchor="middle" font-size="7" fill="white">Door</text>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Network",
        "azure_icon_key": "front_door_and_cdn_profiles"
    },
    "ai_hub": {
        "icon_svg": '<rect x="6" y="10" width="36" height="28" rx="4" fill="#0078D4"/><circle cx="24" cy="24" r="8" fill="white" opacity="0.9"/><circle cx="24" cy="24" r="4" fill="#0078D4"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "AI",
        "azure_icon_key": "ai_studio"
    },
    "firewall": {
        "icon_svg": '<rect x="6" y="6" width="36" height="36" rx="4" fill="#E8A000"/><text x="24" y="22" text-anchor="middle" font-size="7" fill="white" font-weight="700">Fire</text><text x="24" y="33" text-anchor="middle" font-size="7" fill="white">wall</text>',
        "color": "#E8A000", "bg": "#FFF8E1", "category": "Network",
        "azure_icon_key": "firewalls"
    },
    "document_intelligence": {
        "icon_svg": '<rect x="6" y="6" width="36" height="36" rx="4" fill="#0078D4"/><text x="24" y="22" text-anchor="middle" font-size="9" fill="white" font-weight="700">Doc</text><text x="24" y="33" text-anchor="middle" font-size="9" fill="white">Intel</text>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "AI",
        "azure_icon_key": "form_recognizer"
    },
    "form_recognizer": {
        "icon_svg": '<rect x="6" y="6" width="36" height="36" rx="4" fill="#0078D4"/><text x="24" y="22" text-anchor="middle" font-size="9" fill="white" font-weight="700">Doc</text><text x="24" y="33" text-anchor="middle" font-size="9" fill="white">Intel</text>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "AI",
        "azure_icon_key": "form_recognizer"
    },
    "databricks": {
        "icon_svg": '<rect x="6" y="6" width="36" height="36" rx="6" fill="#FF3621"/><text x="24" y="30" text-anchor="middle" font-size="16" fill="white" font-weight="700">DB</text>',
        "color": "#FF3621", "bg": "#FFF0EE", "category": "Data",
        "azure_icon_key": "azure_databricks"
    },
    "sql_server": {
        "icon_svg": '<rect x="6" y="6" width="36" height="36" rx="4" fill="#0078D4"/><text x="24" y="22" text-anchor="middle" font-size="11" fill="white" font-weight="700">SQL</text><rect x="12" y="28" width="24" height="8" rx="2" fill="white" opacity="0.3"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Data",
        "azure_icon_key": "sql_server"
    },
    "sql_database": {
        "icon_svg": '<rect x="6" y="6" width="36" height="36" rx="4" fill="#0078D4"/><text x="24" y="22" text-anchor="middle" font-size="11" fill="white" font-weight="700">SQL</text><rect x="12" y="28" width="24" height="8" rx="2" fill="white" opacity="0.3"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Data",
        "azure_icon_key": "sql_database"
    },
    "cosmos_db": {
        "icon_svg": '<circle cx="24" cy="24" r="18" fill="#0078D4"/><text x="24" y="22" text-anchor="middle" font-size="9" fill="white" font-weight="700">Cosmos</text><text x="24" y="33" text-anchor="middle" font-size="9" fill="white">DB</text>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Data",
        "azure_icon_key": "azure_cosmos_db"
    },
    "app_service": {
        "icon_svg": '<rect x="6" y="10" width="36" height="28" rx="6" fill="#0078D4"/><text x="24" y="28" text-anchor="middle" font-size="11" fill="white" font-weight="700">App</text>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Compute",
        "azure_icon_key": "app_services"
    },
    "aks": {
        "icon_svg": '<polygon points="24,4 44,20 38,44 10,44 4,20" fill="#326CE5" stroke="#fff" stroke-width="1"/><text x="24" y="30" text-anchor="middle" font-size="11" fill="white" font-weight="700">K8s</text>',
        "color": "#326CE5", "bg": "#EBF0FA", "category": "Compute",
        "azure_icon_key": "kubernetes_services"
    },
    "function_app": {
        "icon_svg": '<polygon points="24,6 42,42 6,42" fill="#F0AD4E"/><text x="24" y="36" text-anchor="middle" font-size="14" fill="white" font-weight="700">ƒ</text>',
        "color": "#F0AD4E", "bg": "#FFF8ED", "category": "Compute",
        "azure_icon_key": "function_apps"
    },
    "synapse": {
        "icon_svg": '<circle cx="24" cy="24" r="18" fill="#0078D4"/><text x="24" y="22" text-anchor="middle" font-size="8" fill="white" font-weight="700">Syn</text><text x="24" y="32" text-anchor="middle" font-size="8" fill="white">apse</text>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Data",
        "azure_icon_key": "azure_synapse_analytics"
    },
    "log_analytics": {
        "icon_svg": '<rect x="6" y="6" width="36" height="36" rx="4" fill="#5C2D91"/><text x="24" y="28" text-anchor="middle" font-size="10" fill="white" font-weight="700">Log</text>',
        "color": "#5C2D91", "bg": "#F3EDF7", "category": "Monitoring",
        "azure_icon_key": "log_analytics_workspaces"
    },
    "app_insights": {
        "icon_svg": '<circle cx="24" cy="24" r="18" fill="#5C2D91"/><text x="24" y="28" text-anchor="middle" font-size="10" fill="white" font-weight="700">AI</text>',
        "color": "#5C2D91", "bg": "#F3EDF7", "category": "Monitoring",
        "azure_icon_key": "application_insights"
    },
    "nsg": {
        "icon_svg": '<rect x="6" y="6" width="36" height="36" rx="4" fill="#E8A000"/><text x="24" y="28" text-anchor="middle" font-size="10" fill="white" font-weight="700">NSG</text>',
        "color": "#E8A000", "bg": "#FFF8E1", "category": "Network",
        "azure_icon_key": "network_security_groups"
    },
    "apim": {
        "icon_svg": '<rect x="6" y="8" width="36" height="32" rx="4" fill="#0078D4"/><path d="M16 20 L32 20 M16 28 L32 28 M24 14 L24 34" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Integration",
        "azure_icon_key": "api_management_services"
    },
    "api_management": {
        "icon_svg": '<rect x="6" y="8" width="36" height="32" rx="4" fill="#0078D4"/><path d="M16 20 L32 20 M16 28 L32 28 M24 14 L24 34" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Integration",
        "azure_icon_key": "api_management_services"
    },
    "service_bus": {
        "icon_svg": '<rect x="6" y="10" width="36" height="28" rx="4" fill="#0078D4"/><path d="M14 24 L22 24 M26 24 L34 24" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="24" cy="24" r="4" fill="white"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Integration",
        "azure_icon_key": "azure_service_bus"
    },
    "logic_apps": {
        "icon_svg": '<rect x="6" y="8" width="36" height="32" rx="4" fill="#0078D4"/><path d="M14 18 L24 28 L34 18" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Integration",
        "azure_icon_key": "logic_apps"
    },
    "logic_app": {
        "icon_svg": '<rect x="6" y="8" width="36" height="32" rx="4" fill="#0078D4"/><path d="M14 18 L24 28 L34 18" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Integration",
        "azure_icon_key": "logic_apps"
    },
    "event_grid": {
        "icon_svg": '<rect x="6" y="8" width="36" height="32" rx="4" fill="#0078D4"/><circle cx="16" cy="18" r="3" fill="white"/><circle cx="32" cy="18" r="3" fill="white"/><circle cx="16" cy="30" r="3" fill="white"/><circle cx="32" cy="30" r="3" fill="white"/><line x1="16" y1="18" x2="32" y2="30" stroke="white" stroke-width="1.5"/><line x1="32" y1="18" x2="16" y2="30" stroke="white" stroke-width="1.5"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Integration",
        "azure_icon_key": "event_grid_topics"
    },
    "container_apps": {
        "icon_svg": '<rect x="6" y="8" width="36" height="32" rx="4" fill="#0078D4"/><rect x="12" y="14" width="10" height="10" rx="2" fill="white" opacity="0.9"/><rect x="26" y="14" width="10" height="10" rx="2" fill="white" opacity="0.9"/><rect x="12" y="28" width="24" height="6" rx="2" fill="white" opacity="0.6"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Compute",
        "azure_icon_key": "container_apps_environments"
    },
    "container_app": {
        "icon_svg": '<rect x="6" y="8" width="36" height="32" rx="4" fill="#0078D4"/><rect x="12" y="14" width="10" height="10" rx="2" fill="white" opacity="0.9"/><rect x="26" y="14" width="10" height="10" rx="2" fill="white" opacity="0.9"/><rect x="12" y="28" width="24" height="6" rx="2" fill="white" opacity="0.6"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Compute",
        "azure_icon_key": "container_apps_environments"
    },
    "postgresql": {
        "icon_svg": '<rect x="8" y="8" width="32" height="32" rx="4" fill="#0078D4"/><text x="24" y="28" text-anchor="middle" font-size="10" fill="white" font-weight="700">PG</text>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Data",
        "azure_icon_key": "azure_database_postgresql_server"
    },
    "mysql": {
        "icon_svg": '<rect x="8" y="8" width="32" height="32" rx="4" fill="#0078D4"/><text x="24" y="28" text-anchor="middle" font-size="10" fill="white" font-weight="700">My</text>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Data",
        "azure_icon_key": "azure_database_mysql_server"
    },
    "load_balancer": {
        "icon_svg": '<circle cx="24" cy="24" r="18" fill="#5C2D91"/><path d="M16 18 L32 18 M16 24 L32 24 M16 30 L32 30" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>',
        "color": "#5C2D91", "bg": "#F3EEF9", "category": "Network",
        "azure_icon_key": "load_balancers"
    },
    "nat_gateway": {
        "icon_svg": '<rect x="6" y="8" width="36" height="32" rx="4" fill="#5C2D91"/><text x="24" y="28" text-anchor="middle" font-size="10" fill="white" font-weight="700">NAT</text>',
        "color": "#5C2D91", "bg": "#F3EEF9", "category": "Network",
        "azure_icon_key": "nat"
    },
    "expressroute": {
        "icon_svg": '<rect x="6" y="8" width="36" height="32" rx="4" fill="#5C2D91"/><path d="M14 24 L34 24" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="14" cy="24" r="4" fill="white"/><circle cx="34" cy="24" r="4" fill="white"/>',
        "color": "#5C2D91", "bg": "#F3EEF9", "category": "Network",
        "azure_icon_key": "expressroute_circuits"
    },
    "sentinel": {
        "icon_svg": '<circle cx="24" cy="24" r="18" fill="#0078D4"/><path d="M24 12 L24 24 L32 28" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="24" cy="24" r="3" fill="white"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Security",
        "azure_icon_key": "azure_sentinel"
    },
    "data_explorer": {
        "icon_svg": '<rect x="6" y="8" width="36" height="32" rx="4" fill="#0078D4"/><path d="M14 30 L20 18 L26 26 L34 14" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Data",
        "azure_icon_key": "azure_data_explorer_clusters"
    },
    "kusto": {
        "icon_svg": '<rect x="6" y="8" width="36" height="32" rx="4" fill="#0078D4"/><path d="M14 30 L20 18 L26 26 L34 14" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Data",
        "azure_icon_key": "azure_data_explorer_clusters"
    },
    "signalr": {
        "icon_svg": '<circle cx="24" cy="24" r="18" fill="#0078D4"/><path d="M16 20 Q24 12 32 20 M16 28 Q24 36 32 28" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Integration",
        "azure_icon_key": "signalr"
    },
    "notification_hub": {
        "icon_svg": '<rect x="6" y="8" width="36" height="32" rx="4" fill="#0078D4"/><path d="M18 16 L24 12 L30 16 L30 28 L18 28 Z" stroke="white" stroke-width="2" fill="white" opacity="0.9"/><circle cx="24" cy="32" r="3" fill="white"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Integration",
        "azure_icon_key": "notification_hubs"
    },
    "spring_apps": {
        "icon_svg": '<circle cx="24" cy="24" r="18" fill="#6DB33F"/><text x="24" y="28" text-anchor="middle" font-size="10" fill="white" font-weight="700">🌱</text>',
        "color": "#6DB33F", "bg": "#EFF8E8", "category": "Compute",
        "azure_icon_key": "azure_spring_apps"
    },
    "static_web_app": {
        "icon_svg": '<rect x="6" y="8" width="36" height="32" rx="4" fill="#0078D4"/><text x="24" y="28" text-anchor="middle" font-size="10" fill="white" font-weight="700">SWA</text>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Compute",
        "azure_icon_key": "static_apps"
    },
    "digital_twins": {
        "icon_svg": '<rect x="6" y="8" width="36" height="32" rx="4" fill="#0078D4"/><circle cx="18" cy="20" r="5" fill="white" opacity="0.9"/><circle cx="30" cy="20" r="5" fill="white" opacity="0.9"/><line x1="18" y1="25" x2="18" y2="34" stroke="white" stroke-width="2"/><line x1="30" y1="25" x2="30" y2="34" stroke="white" stroke-width="2"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "IoT",
        "azure_icon_key": "digital_twins"
    },
    "backup": {
        "icon_svg": '<rect x="8" y="8" width="32" height="32" rx="4" fill="#0078D4"/><path d="M16 28 L24 16 L32 28 Z" stroke="white" stroke-width="2" fill="white" opacity="0.8"/>',
        "color": "#0078D4", "bg": "#E8F4FD", "category": "Management",
        "azure_icon_key": "backup_vault"
    },
}

CONNECTION_STYLES = {
    "api":      {"color": "#0078D4", "dash": "0"},
    "data":     {"color": "#0F9D58", "dash": "0"},
    "security": {"color": "#E8A000", "dash": "5,5"},
    "private":  {"color": "#5C2D91", "dash": "3,3"},
    "network":  {"color": "#5C2D91", "dash": "5,5"},
    "default":  {"color": "#999999", "dash": "0"},
}


_TYPE_ALIASES = {
    # Azure ARM 資源名稱 → 標準圖表類型
    # 網路
    "private_endpoints": "pe", "private_endpoint": "pe",
    "virtual_networks": "vnet", "virtual_network": "vnet",
    "network_security_groups": "nsg", "network_security_group": "nsg",
    "bastion_hosts": "bastion", "bastion_host": "bastion",
    "application_gateways": "app_gateway", "application_gateway": "app_gateway",
    "front_doors": "front_door", "front_door_and_cdn_profiles": "front_door",
    "virtual_network_gateways": "vpn", "vpn_gateways": "vpn",
    "load_balancers": "load_balancer",
    "nat_gateways": "nat_gateway",
    "expressroute_circuits": "expressroute",
    "firewalls": "firewall",
    "cdn_profiles": "cdn",
    # 資料
    "data_factories": "adf", "data_factory": "adf",
    "storage_accounts": "storage", "storage_account": "storage",
    "data_lake": "adls", "adls_gen2": "adls", "data_lake_storage": "adls",
    "fabric_capacities": "fabric", "fabric_capacity": "fabric", "microsoft_fabric": "fabric",
    "synapse_workspaces": "synapse", "synapse_workspace": "synapse", "synapse_analytics": "synapse",
    "cosmos": "cosmos_db", "cosmosdb": "cosmos_db", "documentdb": "cosmos_db",
    "sql_databases": "sql_database", "sql_db": "sql_database",
    "sql_servers": "sql_server",
    "redis_caches": "redis", "redis_cache": "redis", "cache_redis": "redis",
    "stream_analytics_jobs": "stream_analytics",
    "databricks_workspaces": "databricks",
    "data_explorer_clusters": "data_explorer", "azure_data_explorer": "data_explorer",
    "postgresql_server": "postgresql", "postgresql_servers": "postgresql",
    "mysql_server": "mysql", "mysql_servers": "mysql",
    # AI
    "cognitive_services": "ai_foundry", "ai_services": "ai_foundry", "foundry": "ai_foundry",
    "azure_openai": "openai",
    "cognitive_search": "search", "search_services": "search", "search_service": "search",
    "machine_learning": "aml", "ml": "aml", "machine_learning_workspaces": "aml",
    "form_recognizers": "document_intelligence",
    "ai_studio": "ai_hub", "foundry_project": "ai_hub",
    # 安全性
    "key_vault": "keyvault", "key_vaults": "keyvault",
    "sentinel": "sentinel", "azure_sentinel": "sentinel",
    # 運算
    "virtual_machines": "vm", "virtual_machine": "vm",
    "app_services": "appservice", "web_apps": "appservice", "web_app": "appservice",
    "function_apps": "function_app", "functions": "function_app",
    "kubernetes_services": "aks", "managed_clusters": "aks", "kubernetes": "aks",
    "container_registries": "acr",
    "container_apps_environments": "container_apps",
    "spring_apps": "spring_apps", "azure_spring_apps": "spring_apps",
    "static_apps": "static_web_app", "static_web_apps": "static_web_app",
    # 整合
    "event_hubs": "event_hub",
    "event_grid_topics": "event_grid", "event_grid_domains": "event_grid",
    "api_management_services": "apim",
    "service_bus_namespaces": "service_bus",
    "logic_app": "logic_apps",
    "notification_hubs": "notification_hub",
    # 監控
    "log_analytics_workspaces": "log_analytics",
    "application_insights": "appinsights", "app_insight": "appinsights",
    # IoT
    "iot_hubs": "iot_hub",
    # 管理
    "backup_vaults": "backup", "backup_vault": "backup",
}

def get_service_info(svc_type: str) -> dict:
    t = svc_type.lower().replace("-", "_").replace(" ", "_")
    t = _TYPE_ALIASES.get(t, t)
    info = SERVICE_ICONS.get(t, SERVICE_ICONS["default"]).copy()
    # 若可用，加入官方 Azure 圖示 data URI
    azure_key = info.get("azure_icon_key", t)
    icon_uri = get_icon_data_uri(azure_key)
    info["icon_data_uri"] = icon_uri
    return info


def generate_html(services: list, connections: list, title: str, vnet_info: str = "", hierarchy: list = None) -> str:
    def _norm(t):
        t = t.lower().replace("-", "_").replace(" ", "_")
        return _TYPE_ALIASES.get(t, t)

    nodes_js = json.dumps([{
        "id": svc["id"],
        "name": svc["name"],
        "type": _norm(svc.get("type", "default")),
        "sku": svc.get("sku", ""),
        "private": svc.get("private", False),
        "details": svc.get("details", []),
        "subscription": svc.get("subscription", ""),
        "resourceGroup": svc.get("resourceGroup", ""),
        "icon_svg": get_service_info(svc.get("type", "default"))["icon_svg"],
        "icon_data_uri": get_service_info(svc.get("type", "default")).get("icon_data_uri", ""),
        "color": get_service_info(svc.get("type", "default"))["color"],
        "bg": get_service_info(svc.get("type", "default"))["bg"],
        "category": get_service_info(svc.get("type", "default"))["category"],
    } for svc in services], ensure_ascii=False)

    hierarchy_js = json.dumps(hierarchy or [], ensure_ascii=False)

    edges_js = json.dumps([{
        "from": conn["from"],
        "to": conn["to"],
        "label": conn.get("label", ""),
        "type": conn.get("type", "default"),
        "color": CONNECTION_STYLES.get(conn.get("type", "default"), CONNECTION_STYLES["default"])["color"],
        "dash": CONNECTION_STYLES.get(conn.get("type", "default"), CONNECTION_STYLES["default"])["dash"],
    } for conn in connections], ensure_ascii=False)

    pe_count = sum(1 for s in services if _norm(s.get("type", "default")) == "pe")
    svc_count = len(services) - pe_count
    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M")
    vnet_info_js = json.dumps(vnet_info, ensure_ascii=False)

    html = f"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Segoe+UI:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: 'Segoe UI', 'Inter', -apple-system, sans-serif; background: #f3f2f1; color: #323130; }}

  .header {{
    background: white; border-bottom: 1px solid #edebe9;
    padding: 12px 24px; display: flex; align-items: center; gap: 14px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }}
  .header-icon {{
    width: 32px; height: 32px; border-radius: 4px;
    background: linear-gradient(135deg, #0078D4, #00BCF2);
    display: flex; align-items: center; justify-content: center;
  }}
  .header-icon svg {{ width: 20px; height: 20px; }}
  .header h1 {{ font-size: 15px; font-weight: 600; color: #201f1e; }}
  .header .meta {{ font-size: 11px; color: #a19f9d; }}
  .header-right {{ margin-left: auto; display: flex; gap: 16px; align-items: center; }}
  .stat {{ font-size: 11px; color: #605e5c; }}
  .stat b {{ color: #323130; }}

  .container {{ display: flex; height: calc(100vh - 56px); }}

  .canvas-area {{
    flex: 1; position: relative; overflow: hidden;
    background: white;
    background-image:
      linear-gradient(#faf9f8 1px, transparent 1px),
      linear-gradient(90deg, #faf9f8 1px, transparent 1px);
    background-size: 24px 24px;
  }}
  #canvas {{ position: absolute; top: 0; left: 0; width: 100%; height: 100%; }}

  .toolbar {{
    position: absolute; top: 10px; left: 10px;
    display: flex; gap: 1px; z-index: 10;
    background: white; border: 1px solid #edebe9; border-radius: 6px;
    padding: 2px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }}
  .tool-btn {{
    background: transparent; border: none; border-radius: 4px;
    padding: 5px 10px; font-size: 11px; cursor: pointer; color: #605e5c;
    font-family: inherit; transition: all 0.1s;
  }}
  .tool-btn:hover {{ background: #f3f2f1; color: #323130; }}
  .tool-sep {{ width: 1px; background: #edebe9; margin: 3px 1px; }}

  .zoom-indicator {{
    position: absolute; top: 10px; right: 286px;
    background: white; border: 1px solid #edebe9; border-radius: 4px;
    padding: 3px 8px; font-size: 10px; color: #a19f9d; z-index: 10;
  }}

  /* ── Sidebar ── */
  .sidebar {{
    width: 272px; background: #faf9f8; border-left: 1px solid #edebe9;
    overflow-y: auto; display: flex; flex-direction: column;
  }}
  .sidebar::-webkit-scrollbar {{ width: 3px; }}
  .sidebar::-webkit-scrollbar-thumb {{ background: #c8c6c4; border-radius: 3px; }}

  .sidebar-header {{
    padding: 12px 14px; border-bottom: 1px solid #edebe9;
    font-weight: 600; font-size: 12px; color: #605e5c;
    position: sticky; top: 0; background: #faf9f8; z-index: 1;
  }}
  .cat-label {{
    padding: 10px 14px 4px; font-size: 10px; color: #a19f9d;
    font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
  }}
  .service-card {{
    margin: 2px 6px; border: 1px solid #edebe9; border-radius: 6px;
    overflow: hidden; cursor: pointer; transition: all 0.1s;
    background: white;
  }}
  .service-card:hover {{ border-color: #c8c6c4; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }}
  .service-card.selected {{ border-color: #0078D4; box-shadow: 0 0 0 1px #0078D4; }}
  .service-card-header {{
    padding: 7px 10px; display: flex; align-items: center; gap: 8px;
  }}
  .sc-icon {{ width: 28px; height: 28px; flex-shrink: 0; }}
  .sc-icon svg {{ width: 28px; height: 28px; }}
  .service-name {{ font-size: 12px; font-weight: 600; color: #323130; }}
  .service-sku {{ font-size: 10px; color: #a19f9d; }}
  .service-card-body {{ padding: 2px 10px 6px; }}
  .service-detail {{ font-size: 10px; color: #605e5c; padding: 1px 0; }}
  .service-detail::before {{ content: "› "; color: #a19f9d; }}
  .private-badge {{
    font-size: 9px; background: #f3eef9; color: #5C2D91;
    border-radius: 3px; padding: 1px 5px; margin-left: auto;
    border: 1px solid #e0d4f5;
  }}

  .legend {{
    padding: 10px 14px; border-top: 1px solid #edebe9; margin-top: auto;
  }}
  .legend-title {{ font-size: 10px; font-weight: 600; color: #a19f9d; margin-bottom: 5px; }}
  .legend-item {{ display: flex; align-items: center; gap: 6px; font-size: 10px; color: #605e5c; margin-bottom: 2px; }}
  .legend-line {{ width: 18px; height: 2px; border-radius: 1px; }}
  .legend-line-dash {{ width: 18px; height: 0; border-top: 2px dashed; }}

  /* ── SVG styles ── */
  .node {{ cursor: grab; pointer-events: all; }}
  .node:active {{ cursor: grabbing; }}
  .node .node-bg {{ pointer-events: all; }}
  .node.selected .node-bg {{ stroke: #0078D4; stroke-width: 2.5; }}
  .node.selected {{ filter: drop-shadow(0 0 6px rgba(0,120,212,0.4)); }}

  /* ── Edge highlight on node select ── */
  .edge-path {{ transition: opacity 0.2s, stroke-width 0.2s; }}
  .edge-label {{ transition: opacity 0.2s; }}
  .edge-path.highlight {{ opacity: 1 !important; stroke-width: 2.5 !important; filter: drop-shadow(0 0 4px rgba(0,120,212,0.5)); }}
  .edge-path.dimmed {{ opacity: 0.1 !important; }}
  .edge-label.highlight {{ opacity: 1 !important; font-weight: 700; }}
  .edge-label.dimmed {{ opacity: 0.15 !important; }}
  .edge-label-bg.highlight {{ stroke: #0078D4 !important; stroke-width: 1.5 !important; }}
  .edge-label-bg.dimmed {{ opacity: 0.15 !important; }}
  .node.dimmed {{ opacity: 0.25; transition: opacity 0.2s; }}

  .subnet-rect {{
    rx: 6; ry: 6;
  }}
  .subnet-label {{
    font-size: 11px; font-weight: 600; font-family: 'Segoe UI', sans-serif;
  }}

  .status-bar {{
    position: absolute; bottom: 10px; left: 10px;
    background: white; border: 1px solid #edebe9; border-radius: 4px;
    padding: 4px 10px; font-size: 10px; color: #a19f9d;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }}

  .tooltip {{
    position: absolute; background: white; color: #323130;
    border: 1px solid #edebe9; padding: 8px 12px;
    border-radius: 6px; font-size: 11px; pointer-events: none;
    white-space: nowrap; z-index: 100; display: none;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  }}
  .tooltip strong {{ color: #201f1e; }}
  .tooltip-detail {{ color: #605e5c; margin-top: 1px; font-size: 10px; }}
</style>
</head>
<body>

<div class="header">
  <div class="header-icon">
    <svg viewBox="0 0 24 24"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="white" opacity="0.9"/></svg>
  </div>
  <div>
    <h1>{title}</h1>
    <div class="meta">Azure 架構 &middot; {generated_at}</div>
  </div>
  <div class="header-right">
    <div class="stat"><b>{svc_count}</b> 服務</div>
    <div class="stat"><b>{pe_count}</b> 私用端點</div>
    <div class="stat"><b>{len(connections)}</b> 連線</div>
  </div>
</div>

<div class="container">
  <div class="canvas-area">
    <div class="toolbar">
      <button class="tool-btn" onclick="fitToScreen()">適應</button>
      <div class="tool-sep"></div>
      <button class="tool-btn" onclick="zoomIn()">+</button>
      <button class="tool-btn" onclick="zoomOut()">&minus;</button>
      <div class="tool-sep"></div>
      <button class="tool-btn" onclick="textBigger()" title="放大文字" style="font-size:13px;">A+</button>
      <button class="tool-btn" onclick="textSmaller()" title="縮小文字" style="font-size:10px;">A&minus;</button>
      <div class="tool-sep"></div>
      <button class="tool-btn" onclick="downloadPNG()" title="下載 PNG">&#128247; PNG</button>
    </div>
    <div class="zoom-indicator" id="zoom-level">100%</div>
    <svg id="canvas">
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" opacity="0.7"/>
        </marker>
        <marker id="arr-data" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" opacity="0.7"/>
        </marker>
        <marker id="arr-sec" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" opacity="0.7"/>
        </marker>
        <marker id="arr-pe" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" opacity="0.7"/>
        </marker>
        <filter id="shadow">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.08"/>
        </filter>
      </defs>
      <g id="diagram-root"></g>
    </svg>
    <div id="tooltip" class="tooltip"></div>
    <div class="status-bar">拖曳節點 · 捲動縮放 · 拖曳空白處以平移</div>
  </div>

  <div class="sidebar">
    <div class="sidebar-header">資源</div>
    <div id="service-list"></div>
    <div class="legend">
      <div class="legend-title">連線類型</div>
      <div class="legend-item"><div class="legend-line" style="background:#0078D4;"></div> API</div>
      <div class="legend-item"><div class="legend-line" style="background:#0F9D58;"></div> 資料</div>
      <div class="legend-item"><div class="legend-line-dash" style="border-color:#E8A000;"></div> 安全性</div>
      <div class="legend-item"><div class="legend-line-dash" style="border-color:#5C2D91;"></div> 私用端點</div>
    </div>
  </div>
</div>

<script>
const NODES = {nodes_js};
const EDGES = {edges_js};
const VNET_INFO = {vnet_info_js};
const HIERARCHY = {hierarchy_js};

// ── 節點尺寸 ──
const SVC_W = 180, SVC_H = 120;  // 服務節點（上方圖示、下方名稱）— 放大 20%
const PE_W = 120, PE_H = 84;     // PE 節點（較小）— 放大 20%
const GAP = 40;

// ── 版面：分類群組框樣式 ──
// 每個分類都有標示框，內部以網格排列服務。
// 群組以 2D 方式排列：上方是主要服務群組，下方是底部群組。
// PE 節點放在獨立的 PE 子網群組中。

const positions = {{}};
const useRgLayout = HIERARCHY.length > 0 && NODES.some(n => n.resourceGroup);
const peNodes = useRgLayout ? [] : NODES.filter(n => n.type === 'pe');  // RG 模式：PE 已包含在 mainNodes 中
const mainNodes = useRgLayout ? NODES : NODES.filter(n => n.type !== 'pe');

// 群組框版面參數
const GROUP_PAD = 24;
const GROUP_TITLE_H = 28;
const GROUP_GAP = 60;
const COLS_PER_GROUP = 3;
const CELL_W = SVC_W + 100;
const CELL_H = SVC_H + 90;

function groupDimensions(nodeCount) {{
  const cols = Math.min(nodeCount, COLS_PER_GROUP);
  const rows = Math.ceil(nodeCount / COLS_PER_GROUP);
  const w = cols * CELL_W + GROUP_PAD * 2;
  const h = rows * CELL_H + GROUP_PAD + GROUP_TITLE_H;
  return {{ w, h, cols, rows }};
}}

const groupBoxes = [];

// ── 版面策略：以 RG 為基礎（若有 HIERARCHY）或以分類為基礎（預設） ──

if (useRgLayout) {{
  // ── 以 RG 為基礎的版面：依 Subscription > ResourceGroup 分組 ──
  let gx = 60, gy = 140;
  let subStartX = 60;
  const SUB_GAP = 80;
  const RG_GAP = 60;

  HIERARCHY.forEach((sub, subIdx) => {{
    let rgX = gx;
    let rgMaxH = 0;

    const subRGs = sub.resourceGroups || [];
    subRGs.forEach((rgName, rgIdx) => {{
      const rgNodes = mainNodes.filter(n => n.subscription === sub.subscription && n.resourceGroup === rgName);
      if (rgNodes.length === 0) return;

      const dim = groupDimensions(rgNodes.length);

      rgNodes.forEach((n, i) => {{
        const col = i % dim.cols;
        const row = Math.floor(i / dim.cols);
        positions[n.id] = {{
          x: rgX + GROUP_PAD + col * CELL_W + (CELL_W - SVC_W) / 2,
          y: gy + GROUP_TITLE_H + row * CELL_H + (CELL_H - SVC_H) / 2
        }};
      }});

      groupBoxes.push({{
        cat: rgName, x: rgX, y: gy, w: dim.w, h: dim.h,
        color: rgNodes[0]?.color || '#0078D4',
        isRG: true, subscription: sub.subscription
      }});

      rgX += dim.w + RG_GAP;
      rgMaxH = Math.max(rgMaxH, dim.h);
    }});

    // 下一個訂閱列
    if (subIdx < HIERARCHY.length - 1) {{
      gy += rgMaxH + SUB_GAP;
      gx = subStartX;
    }}
  }});

  // 將未指派的主要節點（沒有 subscription/RG）放入一般群組
  const unassigned = mainNodes.filter(n => !positions[n.id]);
  if (unassigned.length > 0) {{
    const allY = Object.values(positions).map(p => p.y);
    const bottomY = allY.length > 0 ? Math.max(...allY) + SVC_H + GROUP_GAP : 140;
    const dim = groupDimensions(unassigned.length);
    unassigned.forEach((n, i) => {{
      const col = i % dim.cols;
      const row = Math.floor(i / dim.cols);
      positions[n.id] = {{
        x: 60 + GROUP_PAD + col * CELL_W + (CELL_W - SVC_W) / 2,
        y: bottomY + GROUP_TITLE_H + row * CELL_H + (CELL_H - SVC_H) / 2
      }};
    }});
    groupBoxes.push({{
      cat: 'Other', x: 60, y: bottomY, w: dim.w, h: dim.h,
      color: '#666'
    }});
  }}

}} else {{
  // ── 以分類為基礎的版面（原始） ──
  const bottomCategories = ['Network', 'External', 'Monitor', 'Monitoring'];
  const catOrder = ['AI', 'Data', 'Security', 'Compute', 'Integration', 'DevOps', 'IoT', 'Azure'];

  const catGroups = {{}};
  mainNodes.forEach(n => {{
    const cat = n.category || 'Azure';
    if (!catGroups[cat]) catGroups[cat] = [];
    catGroups[cat].push(n);
  }});

// 動態加入不在 catOrder 或 bottomCategories 中的分類
const extraCats = Object.keys(catGroups).filter(cat => !catOrder.includes(cat) && !bottomCategories.includes(cat));
const fullCatOrder = [...catOrder, ...extraCats];

// ── 以流動網格排列主要服務群組 ──
const serviceGroups = fullCatOrder.filter(cat => catGroups[cat] && catGroups[cat].length > 0
  && !bottomCategories.includes(cat));

let gx = 60, gy = 140;
let rowMaxH = 0;
let rowStartX = 60;
const MAX_ROW_W = Math.max(1600, serviceGroups.length * 400);

serviceGroups.forEach(cat => {{
  const nodes = catGroups[cat];
  const dim = groupDimensions(nodes.length);

  // 若寬度過大則換到下一列
  if (gx + dim.w > rowStartX + MAX_ROW_W && gx > rowStartX) {{
    gx = rowStartX;
    gy += rowMaxH + GROUP_GAP;
    rowMaxH = 0;
  }}

  // 將節點放入群組網格中
  nodes.forEach((n, i) => {{
    const col = i % dim.cols;
    const row = Math.floor(i / dim.cols);
    positions[n.id] = {{
      x: gx + GROUP_PAD + col * CELL_W + (CELL_W - SVC_W) / 2,
      y: gy + GROUP_TITLE_H + row * CELL_H + (CELL_H - SVC_H) / 2
    }};
  }});

  groupBoxes.push({{
    cat, x: gx, y: gy, w: dim.w, h: dim.h,
    color: nodes[0]?.color || '#0078D4'
  }});

  gx += dim.w + GROUP_GAP;
  rowMaxH = Math.max(rowMaxH, dim.h);
}});

// ── 放置底部群組（Network、External、Monitor） ──
const bottomGroupY = gy + rowMaxH + GROUP_GAP + 20;
let bgx = 60;
bottomCategories.forEach(cat => {{
  const nodes = catGroups[cat];
  if (!nodes || nodes.length === 0) return;
  const dim = groupDimensions(nodes.length);

  nodes.forEach((n, i) => {{
    const col = i % dim.cols;
    const row = Math.floor(i / dim.cols);
    positions[n.id] = {{
      x: bgx + GROUP_PAD + col * CELL_W + (CELL_W - SVC_W) / 2,
      y: bottomGroupY + GROUP_TITLE_H + row * CELL_H + (CELL_H - SVC_H) / 2
    }};
  }});

  groupBoxes.push({{
    cat, x: bgx, y: bottomGroupY, w: dim.w, h: dim.h,
    color: nodes[0]?.color || '#666',
    isBottom: true
  }});

  bgx += dim.w + GROUP_GAP;
}});

}} // 結束 else（以分類為基礎的版面）

// ── PE 節點放置 ──
if (useRgLayout) {{
  // RG 模式：PE 節點放入各自的 RG 框中
  // 若 PE 已有 subscription/resourceGroup，RG 版面已經設定好位置
  // 沒有 RG 指派的 PE 會放到獨立群組
  const unplacedPEs = peNodes.filter(pe => !positions[pe.id]);
  if (unplacedPEs.length > 0) {{
    // 找出最右側 RG 框的位置
    const allGbRight = groupBoxes.length > 0 ? Math.max(...groupBoxes.map(gb => gb.x + gb.w)) : 0;
    const peStartX = allGbRight + GROUP_GAP;
    const peStartY = 140;
    const peCols = Math.min(unplacedPEs.length, 4);
    const peCellW = PE_W + 50;
    const peCellH = PE_H + 30;
    const peBoxW = peCols * peCellW + GROUP_PAD * 2;
    const peRows = Math.ceil(unplacedPEs.length / peCols);
    const peBoxH = peRows * peCellH + GROUP_PAD + GROUP_TITLE_H;

    unplacedPEs.forEach((pe, i) => {{
      const col = i % peCols;
      const row = Math.floor(i / peCols);
      positions[pe.id] = {{
        x: peStartX + GROUP_PAD + col * peCellW + (peCellW - PE_W) / 2,
        y: peStartY + GROUP_TITLE_H + row * peCellH + (peCellH - PE_H) / 2
      }};
    }});
    groupBoxes.push({{
      cat: 'Private Endpoints', x: peStartX, y: peStartY, w: peBoxW, h: peBoxH,
      color: '#5C2D91', isPE: true
    }});
  }}
}} else {{
  // 分類模式：PE 節點放在服務群組上方的獨立群組
  const PE_Y = 40;
  if (peNodes.length > 0) {{
    const peCols = Math.min(peNodes.length, 6);
    const peRows = Math.ceil(peNodes.length / peCols);
    const peCellW = PE_W + 50;
    const peCellH = PE_H + 30;
    const peBoxW = peCols * peCellW + GROUP_PAD * 2;
    const peBoxH = peRows * peCellH + GROUP_PAD + GROUP_TITLE_H;

    peNodes.forEach((pe, i) => {{
      const col = i % peCols;
      const row = Math.floor(i / peCols);
      positions[pe.id] = {{
        x: 60 + GROUP_PAD + col * peCellW + (peCellW - PE_W) / 2,
        y: PE_Y + GROUP_TITLE_H + row * peCellH + (peCellH - PE_H) / 2
      }};
    }});

    groupBoxes.push({{
      cat: 'Private Endpoints', x: 60, y: PE_Y, w: peBoxW, h: peBoxH,
      color: '#5C2D91', isPE: true
    }});

    const peBottom = PE_Y + peBoxH + GROUP_GAP;
    if (peBottom > 140) {{
      const shift = peBottom - 140;
      NODES.forEach(n => {{
        if (n.type !== 'pe' && positions[n.id]) {{
          positions[n.id].y += shift;
        }}
      }});
      groupBoxes.forEach(gb => {{
        if (!gb.isPE) gb.y += shift;
      }});
    }}
  }}
}}

// ── 節點 → 群組對應（供邊路由使用） ──
const nodeGroupMap = {{}};
groupBoxes.forEach((gb, idx) => {{
  NODES.forEach(n => {{
    const pos = positions[n.id];
    if (!pos) return;
    const nw = n.type === 'pe' ? PE_W : SVC_W;
    const nh = n.type === 'pe' ? PE_H : SVC_H;
    const ncx = pos.x + nw / 2;
    const ncy = pos.y + nh / 2;
    if (ncx >= gb.x && ncx <= gb.x + gb.w && ncy >= gb.y && ncy <= gb.y + gb.h) {{
      nodeGroupMap[n.id] = idx;
    }}
  }});
}});
// 路由走廊邊距（所有群組框外側）
const _rightMarginBase = groupBoxes.length > 0 ? Math.max(...groupBoxes.map(g => g.x + g.w)) + 40 : 800;
const _leftMarginBase = groupBoxes.length > 0 ? Math.min(...groupBoxes.map(g => g.x)) - 40 : -40;

// ── 狀態 ──
let dragging = null, dragOffX = 0, dragOffY = 0;
let draggingGroup = null, groupDragNodes = [];  // for RG/group box dragging
let _dragStartX = 0, _dragStartY = 0, _didDrag = false;  // global so renderDiagram rebuilding DOM mid-drag doesn't reset them
let viewTransform = {{ x: 0, y: 0, scale: 1 }};
let isPanning = false, panSX = 0, panSY = 0, panSTx = 0, panSTy = 0;
let _routeCounter = 0;

// ── 雙向醒目顯示 ──
let _selectedNodeId = null;

function selectNode(nodeId) {{
  const wasSelected = _selectedNodeId === nodeId;

  // 清除所有選取
  clearSelection();

  // 若點到同一節點則切換關閉
  if (wasSelected) {{ _selectedNodeId = null; return; }}

  _selectedNodeId = nodeId;
  applySelectionHighlight();
  // 初次選取時將側邊欄卡片捲動到可視範圍
  const sCard = document.getElementById('card-' + nodeId);
  if (sCard) sCard.scrollIntoView({{ behavior: 'smooth', block: 'nearest' }});
}}

// 重新套用目前 _selectedNodeId 的 CSS 類別（在 renderDiagram 重建 DOM 後呼叫）
function applySelectionHighlight() {{
  const nodeId = _selectedNodeId;
  if (!nodeId) return;

  // 醒目顯示圖表節點
  const svgNode = document.querySelector(`.node[data-id="${{nodeId}}"]`);
  if (svgNode) svgNode.classList.add('selected');
  // 醒目顯示側邊欄卡片
  const card = document.getElementById('card-' + nodeId);
  if (card) card.classList.add('selected');

  // 找出相連的邊（此節點為起點或終點）
  const connectedNodeIds = new Set([nodeId]);
  document.querySelectorAll('.edge-path').forEach(p => {{
    const f = p.getAttribute('data-from'), t = p.getAttribute('data-to');
    if (f === nodeId || t === nodeId) {{
      p.classList.add('highlight');
      connectedNodeIds.add(f);
      connectedNodeIds.add(t);
    }} else {{
      p.classList.add('dimmed');
    }}
  }});
  document.querySelectorAll('.edge-label').forEach(g => {{
    const f = g.getAttribute('data-from'), t = g.getAttribute('data-to');
    if (f === nodeId || t === nodeId) {{
      g.classList.add('highlight');
      g.querySelector('.edge-label-bg')?.classList.add('highlight');
    }} else {{
      g.classList.add('dimmed');
      g.querySelector('.edge-label-bg')?.classList.add('dimmed');
    }}
  }});
  // 將未連結節點淡化
  document.querySelectorAll('.node').forEach(n => {{
    const nid = n.getAttribute('data-id');
    if (!connectedNodeIds.has(nid)) n.classList.add('dimmed');
  }});
}}

function clearSelection() {{
  _selectedNodeId = null;
  document.querySelectorAll('.node').forEach(n => {{ n.classList.remove('selected', 'dimmed'); }});
  document.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.edge-path').forEach(p => {{ p.classList.remove('highlight', 'dimmed'); }});
  document.querySelectorAll('.edge-label').forEach(g => {{ g.classList.remove('highlight', 'dimmed'); }});
  document.querySelectorAll('.edge-label-bg').forEach(r => {{ r.classList.remove('highlight', 'dimmed'); }});
}}

function markerFor(type) {{
  if (type === 'data') return 'arr-data';
  if (type === 'security') return 'arr-sec';
  if (type === 'private') return 'arr-pe';
  return 'arr';
}}

function renderDiagram() {{
  const root = document.getElementById('diagram-root');
  root.innerHTML = '';
  _routeCounter = 0;  // reset stagger counter each render

  // ── VNet 邊界（提前計算，讓 avoidNodes 能把繞路推到 VNet 外） ──
  let _vnetBounds = null;
  if (!useRgLayout) {{
    const _pg = groupBoxes.filter(gb => !gb.isBottom);
    const _hasPriv = NODES.some(n => n.private && n.type !== 'pe');
    const _hasVNI = VNET_INFO && VNET_INFO.length > 0;
    const _hasPe = NODES.some(n => n.type === 'pe');
    if (_pg.length > 0 && (_hasPriv || _hasVNI || _hasPe)) {{
      const vx = Math.min(..._pg.map(g => g.x)) - 16;
      const vy = Math.min(..._pg.map(g => g.y)) - 36;
      const vR = Math.max(..._pg.map(g => g.x + g.w)) + 16;
      const vB = Math.max(..._pg.map(g => g.y + g.h)) + 16;
      _vnetBounds = {{ x: vx, y: vy, w: vR - vx, h: vB - vy }};
    }}
  }}

  // ── 繪製 VNet 邊界（僅在以分類為基礎的版面中，不套用 RG 版面） ──
  if (!useRgLayout) {{
  const privateGroups = groupBoxes.filter(gb => !gb.isBottom);
  const hasPrivateNodes = NODES.some(n => n.private && n.type !== 'pe');
  const hasVNetInfo = VNET_INFO && VNET_INFO.length > 0;
  const hasPeNodes = NODES.some(n => n.type === 'pe');
  const showVNet = hasPrivateNodes || hasVNetInfo || hasPeNodes;

  if (privateGroups.length > 0 && showVNet) {{
      const vx = Math.min(...privateGroups.map(g => g.x)) - 16;
      const vy = Math.min(...privateGroups.map(g => g.y)) - 36;
      const vRight = Math.max(...privateGroups.map(g => g.x + g.w)) + 16;
      const vBottom = Math.max(...privateGroups.map(g => g.y + g.h)) + 16;

      const vr = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      vr.setAttribute('x', vx); vr.setAttribute('y', vy);
      vr.setAttribute('width', vRight - vx); vr.setAttribute('height', vBottom - vy);
      vr.setAttribute('fill', '#f8f7ff'); vr.setAttribute('stroke', '#5C2D91');
      vr.setAttribute('stroke-width', '2'); vr.setAttribute('stroke-dasharray', '8,4');
      vr.setAttribute('rx', '12');
      root.appendChild(vr);

      const vnetLabel = VNET_INFO ? `Virtual Network (${{VNET_INFO}})` : 'Virtual Network';
      const vl = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      vl.setAttribute('class', 'vnet-boundary-label');
      vl.setAttribute('style', 'cursor: pointer;');
      vl.innerHTML = `<svg x="${{vx + 10}}" y="${{vy + 6}}" width="20" height="20" viewBox="0 0 48 48">
        <rect x="6" y="6" width="36" height="36" rx="4" fill="none" stroke="#5C2D91" stroke-width="3"/>
        <circle cx="16" cy="18" r="3" fill="#5C2D91"/><circle cx="32" cy="18" r="3" fill="#5C2D91"/><circle cx="24" cy="32" r="3" fill="#5C2D91"/>
      </svg>
      <text x="${{vx + 34}}" y="${{vy + 20}}" font-size="12" font-weight="600" fill="#5C2D91" font-family="Segoe UI, sans-serif">${{vnetLabel}}</text>`;
      root.appendChild(vl);

      // 儲存 VNet 矩形參照供醒目顯示使用
      vr.setAttribute('id', 'vnet-rect');
      vl.addEventListener('click', () => {{ toggleVNetHighlight(); }});
      root.appendChild(vl);
  }}
  }} // 結束 if(!useRgLayout) 的 VNet 邊界處理

  // ── 繪製群組框（分類或 RG，取決於版面模式） ──
  const _groupLabelElements = []; // 儲存標籤以便重新疊到邊線上方
  groupBoxes.forEach(gb => {{
    if (gb.isPE) {{
      // PE 群組：一律以虛線樣式繪製
      const gr = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      gr.setAttribute('x', gb.x); gr.setAttribute('y', gb.y);
      gr.setAttribute('width', gb.w); gr.setAttribute('height', gb.h);
      gr.setAttribute('rx', '8'); gr.setAttribute('fill', '#f3eef9');
      gr.setAttribute('stroke', '#c8b8e8'); gr.setAttribute('stroke-width', '1.2');
      gr.setAttribute('stroke-dasharray', '4,4');
      root.appendChild(gr);
    }} else {{
      // 服務群組（分類或 RG）
      const gr = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      gr.setAttribute('x', gb.x); gr.setAttribute('y', gb.y);
      gr.setAttribute('width', gb.w); gr.setAttribute('height', gb.h);
      gr.setAttribute('rx', '8');
      gr.setAttribute('fill', gb.isRG ? '#fafafa' : 'white');
      gr.setAttribute('stroke', gb.isRG ? gb.color : '#c8c6c4');
      gr.setAttribute('stroke-width', gb.isRG ? '1.5' : '1.2');
      if (gb.isRG) gr.setAttribute('stroke-dasharray', '6,3');
      root.appendChild(gr);
    }}

    // 標題列
    const titleBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    titleBar.setAttribute('x', gb.x); titleBar.setAttribute('y', gb.y);
    titleBar.setAttribute('width', gb.w); titleBar.setAttribute('height', GROUP_TITLE_H);
    titleBar.setAttribute('rx', '8');
    titleBar.setAttribute('fill', gb.color);
    titleBar.setAttribute('opacity', '0.1');
    root.appendChild(titleBar);
    const titleFill = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    titleFill.setAttribute('x', gb.x); titleFill.setAttribute('y', gb.y + GROUP_TITLE_H - 8);
    titleFill.setAttribute('width', gb.w); titleFill.setAttribute('height', '8');
    titleFill.setAttribute('fill', gb.color); titleFill.setAttribute('opacity', '0.1');
    root.appendChild(titleFill);

    // 顏色強調線
    const accent = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    accent.setAttribute('x', gb.x); accent.setAttribute('y', gb.y);
    accent.setAttribute('width', gb.w); accent.setAttribute('height', '3');
    accent.setAttribute('rx', '8'); accent.setAttribute('fill', gb.color);
    root.appendChild(accent);

    // 群組標籤：RG 使用 📁，PE 使用「Private Endpoints」，分類則使用分類名稱
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', gb.x + 12); label.setAttribute('y', gb.y + 18);
    label.setAttribute('font-size', '12'); label.setAttribute('font-weight', '600');
    label.setAttribute('fill', gb.color); label.setAttribute('font-family', 'Segoe UI, sans-serif');
    label.textContent = gb.isRG ? `📁 ${{gb.cat}}` : gb.cat;
    root.appendChild(label);
    _groupLabelElements.push(label);

    // 讓標題列可拖曳：會拖動內部所有節點
    titleBar.style.cursor = 'grab';
    const gbIdx = groupBoxes.indexOf(gb);
    titleBar.addEventListener('mousedown', e => {{
      if (e.button !== 0) return;
      e.stopPropagation(); e.preventDefault();
      draggingGroup = gbIdx;
      const svgPt = getSVGPoint(e);
      dragOffX = svgPt.x; dragOffY = svgPt.y;
      // 找出此群組框內的所有節點
      groupDragNodes = NODES.filter(n => {{
        const pos = positions[n.id];
        if (!pos) return false;
        const nw = n.type === 'pe' ? PE_W : SVC_W;
        const nh = n.type === 'pe' ? PE_H : SVC_H;
        const cx = pos.x + nw/2, cy = pos.y + nh/2;
        return cx >= gb.x && cx <= gb.x + gb.w && cy >= gb.y && cy <= gb.y + gb.h;
      }}).map(n => n.id);
    }});
  }});

  // ── 繪製 Subscription 邊界（只有多個 Subscription 時才顯示，且在群組框之後繪製） ──
  if (HIERARCHY.length > 1 && useRgLayout) {{
    HIERARCHY.forEach((sub, subIdx) => {{
      // 找出屬於此 Subscription 的所有 RG 框
      const subRgBoxes = groupBoxes.filter(gb => gb.isRG && gb.subscription === sub.subscription);
      if (subRgBoxes.length === 0) return;

      const sx = Math.min(...subRgBoxes.map(gb => gb.x)) - 20;
      const sy = Math.min(...subRgBoxes.map(gb => gb.y)) - 40;
      const sRight = Math.max(...subRgBoxes.map(gb => gb.x + gb.w)) + 20;
      const sBottom = Math.max(...subRgBoxes.map(gb => gb.y + gb.h)) + 20;

      const sr = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      sr.setAttribute('x', sx); sr.setAttribute('y', sy);
      sr.setAttribute('width', sRight - sx); sr.setAttribute('height', sBottom - sy);
      sr.setAttribute('fill', 'none'); sr.setAttribute('stroke', '#0078D4');
      sr.setAttribute('stroke-width', '2.5'); sr.setAttribute('stroke-dasharray', '12,4');
      sr.setAttribute('rx', '16'); sr.setAttribute('opacity', '0.7');
      root.appendChild(sr);

      const sl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      sl.setAttribute('x', sx + 12); sl.setAttribute('y', sy + 16);
      sl.setAttribute('font-size', '12'); sl.setAttribute('font-weight', '700');
      sl.setAttribute('fill', '#0078D4'); sl.setAttribute('font-family', 'Segoe UI, sans-serif');
      sl.textContent = `📦 ${{sub.subscription}}`;
      root.appendChild(sl);
    }});
  }}

  // ── 邊路由（無障礙） ──
  // 計算全域邊界：所有節點的最底部位置
  function getGlobalBounds() {{
    let minY = Infinity, maxY = -Infinity;
    NODES.forEach(n => {{
      const pos = positions[n.id];
      if (!pos) return;
      const h = n.type === 'pe' ? PE_H : SVC_H;
      if (pos.y < minY) minY = pos.y;
      if (pos.y + h > maxY) maxY = pos.y + h;
    }});
    return {{ minY, maxY }};
  }}

  function getNodeBox(node) {{
    const pos = positions[node.id];
    if (!pos) return null;
    const w = node.type === 'pe' ? PE_W : SVC_W;
    const h = node.type === 'pe' ? PE_H : SVC_H;
    return {{ x: pos.x, y: pos.y, w, h, cx: pos.x + w/2, cy: pos.y + h/2 }};
  }}

  // 邊界點：從矩形邊緣進出
  function borderExit(box, side) {{
    // side: 'top'、'bottom'、'left'、'right'
    if (side === 'top') return {{ x: box.cx, y: box.y }};
    if (side === 'bottom') return {{ x: box.cx, y: box.y + box.h }};
    if (side === 'left') return {{ x: box.x, y: box.cy }};
    if (side === 'right') return {{ x: box.x + box.w, y: box.cy }};
  }}

  // 檢查線段是否碰到任何群組框（供邊路由使用）
  function hitsGroupBox(x1, y1, x2, y2, skipGroupIndices) {{
    for (let gi = 0; gi < groupBoxes.length; gi++) {{
      if (skipGroupIndices.includes(gi)) continue;
      const gb = groupBoxes[gi];
      const pad = 4;
      const left = gb.x - pad, right = gb.x + gb.w + pad;
      const top = gb.y - pad, bottom = gb.y + gb.h + pad;
      const dx = x2 - x1, dy = y2 - y1;
      let tmin = 0, tmax = 1;
      const edges = [[-dx, x1 - left], [dx, right - x1], [-dy, y1 - top], [dy, bottom - y1]];
      let hit = true;
      for (const [p, q] of edges) {{
        if (Math.abs(p) < 0.001) {{ if (q < 0) {{ hit = false; break; }} }}
        else {{
          const t = q / p;
          if (p < 0) {{ if (t > tmin) tmin = t; }}
          else {{ if (t < tmax) tmax = t; }}
          if (tmin > tmax) {{ hit = false; break; }}
        }}
      }}
      if (hit && tmin < tmax) return true;
    }}
    return false;
  }}

  // 找出相鄰群組之間的間隙（同一列）
  function findGapBetween(gi1, gi2) {{
    if (gi1 < 0 || gi2 < 0) return null;
    const g1 = groupBoxes[gi1], g2 = groupBoxes[gi2];
    // 同一列：Y 範圍重疊
    const yOverlap = g1.y < g2.y + g2.h && g2.y < g1.y + g1.h;
    if (!yOverlap) return null;
    // 兩者之間的間隙
    if (g1.x + g1.w < g2.x) return {{ x: (g1.x + g1.w + g2.x) / 2 }};
    if (g2.x + g2.w < g1.x) return {{ x: (g2.x + g2.w + g1.x) / 2 }};
    return null;
  }}

  // 建立帶圓角的正交路徑
  function buildOrthoPath(pts) {{
    let d = `M ${{pts[0].x}} ${{pts[0].y}}`;
    const radius = 6;
    for (let i = 1; i < pts.length - 1; i++) {{
      const prev = pts[i-1], curr = pts[i], next = pts[i+1];
      const dx1 = curr.x - prev.x, dy1 = curr.y - prev.y;
      const dx2 = next.x - curr.x, dy2 = next.y - curr.y;
      const len1 = Math.sqrt(dx1*dx1 + dy1*dy1);
      const len2 = Math.sqrt(dx2*dx2 + dy2*dy2);
      if (len1 < 1 || len2 < 1) {{ d += ` L ${{curr.x}} ${{curr.y}}`; continue; }}
      const r = Math.min(radius, len1/2, len2/2);
      const bx = curr.x - (dx1/len1)*r, by = curr.y - (dy1/len1)*r;
      const ax = curr.x + (dx2/len2)*r, ay = curr.y + (dy2/len2)*r;
      d += ` L ${{bx}} ${{by}} Q ${{curr.x}} ${{curr.y}} ${{ax}} ${{ay}}`;
    }}
    d += ` L ${{pts[pts.length-1].x}} ${{pts[pts.length-1].y}}`;
    return d;
  }}

  // 找出兩條正交線段的交點（僅 H 與 V 交叉）
  function findSegCrossing(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {{
    const aIsH = Math.abs(ay1 - ay2) < 1;
    const bIsH = Math.abs(by1 - by2) < 1;
    if (aIsH === bIsH) return null;
    let hx1, hx2, hy, vx, vy1, vy2;
    if (aIsH) {{
      hy = ay1; hx1 = Math.min(ax1, ax2); hx2 = Math.max(ax1, ax2);
      vx = bx1; vy1 = Math.min(by1, by2); vy2 = Math.max(by1, by2);
    }} else {{
      hy = by1; hx1 = Math.min(bx1, bx2); hx2 = Math.max(bx1, bx2);
      vx = ax1; vy1 = Math.min(ay1, ay2); vy2 = Math.max(ay1, ay2);
    }}
    const MM = 2;
    if (vx > hx1 + MM && vx < hx2 - MM &&
        hy > vy1 + MM && hy < vy2 - MM) {{
      return {{ x: vx, y: hy }};
    }}
    return null;
  }}

  // 建立帶圓角的正交路徑，並在交叉點加入橋接弧線
  function buildPathWithBridges(pts, bridges) {{
    const CR = 6, BR = 12;
    if (pts.length <= 1) return '';

    // 依線段為橋接點建立索引，並按行進方向排序
    const bySeg = {{}};
    (bridges || []).forEach(b => {{
      if (!bySeg[b.segIdx]) bySeg[b.segIdx] = [];
      bySeg[b.segIdx].push(b);
    }});
    for (const si in bySeg) {{
      const i = parseInt(si);
      if (i >= pts.length - 1) continue;
      const p1 = pts[i], p2 = pts[i + 1];
      const isH = Math.abs(p1.y - p2.y) < 1;
      if (isH) {{
        const dir = Math.sign(p2.x - p1.x) || 1;
        bySeg[si].sort((a, b) => (a.x - b.x) * dir);
      }} else {{
        const dir = Math.sign(p2.y - p1.y) || 1;
        bySeg[si].sort((a, b) => (a.y - b.y) * dir);
      }}
    }}

    // 輔助：為某段附加橋接弧線
    function appendBridges(d, segIdx, segP1, segP2) {{
      const segB = bySeg[segIdx] || [];
      if (segB.length === 0) return d;
      const isH = Math.abs(segP1.y - segP2.y) < 1;
      segB.forEach(b => {{
        if (isH) {{
          const dir = Math.sign(segP2.x - segP1.x) || 1;
          d += ` L ${{b.x - BR * dir}} ${{segP1.y}}`;
          d += ` A ${{BR}} ${{BR}} 0 0 ${{dir > 0 ? 1 : 0}} ${{b.x + BR * dir}} ${{segP1.y}}`;
        }} else {{
          const dir = Math.sign(segP2.y - segP1.y) || 1;
          d += ` L ${{segP1.x}} ${{b.y - BR * dir}}`;
          d += ` A ${{BR}} ${{BR}} 0 0 ${{dir > 0 ? 0 : 1}} ${{segP1.x}} ${{b.y + BR * dir}}`;
        }}
      }});
      return d;
    }}

    // 2 點路徑（直線）
    if (pts.length === 2) {{
      let d = `M ${{pts[0].x}} ${{pts[0].y}}`;
      d = appendBridges(d, 0, pts[0], pts[1]);
      d += ` L ${{pts[1].x}} ${{pts[1].y}}`;
      return d;
    }}

    // 多點路徑：包含轉角與橋接
    let d = `M ${{pts[0].x}} ${{pts[0].y}}`;
    for (let i = 1; i < pts.length; i++) {{
      const prev = pts[i - 1], curr = pts[i];
      const isLast = (i === pts.length - 1);

      // 計算非最後點的轉角裁切
      let target = curr, cSuffix = '';
      if (!isLast) {{
        const next = pts[i + 1];
        const dx1 = curr.x - prev.x, dy1 = curr.y - prev.y;
        const dx2 = next.x - curr.x, dy2 = next.y - curr.y;
        const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
        const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        if (len1 >= 1 && len2 >= 1) {{
          const r = Math.min(CR, len1 / 2, len2 / 2);
          const bx = curr.x - (dx1 / len1) * r;
          const by = curr.y - (dy1 / len1) * r;
          const ax = curr.x + (dx2 / len2) * r;
          const ay = curr.y + (dy2 / len2) * r;
          target = {{ x: bx, y: by }};
          cSuffix = ` Q ${{curr.x}} ${{curr.y}} ${{ax}} ${{ay}}`;
        }}
      }}

      // 在線段 (i-1) → i 上繪製橋接
      d = appendBridges(d, i - 1, prev, curr);

      // 畫線到目標點 + 可選的轉角曲線
      d += ` L ${{target.x}} ${{target.y}}${{cSuffix}}`;
    }}
    return d;
  }}

  // ── 避障：讓邊繞過節點 ──
  function segHitsNode(x1, y1, x2, y2, pos, nw, nh, margin) {{
    const nx1 = pos.x - margin, ny1 = pos.y - margin;
    const nx2 = pos.x + nw + margin, ny2 = pos.y + nh + margin;
    if (Math.abs(x1 - x2) < 1) {{
      // 垂直線段
      const x = x1;
      const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
      return x > nx1 && x < nx2 && maxY > ny1 && minY < ny2;
    }} else {{
      // 水平線段
      const y = y1;
      const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
      return y > ny1 && y < ny2 && maxX > nx1 && minX < nx2;
    }}
  }}

  function avoidNodes(pts, fromId, toId) {{
    const MARGIN = 25;
    const SECTION_MARGIN = 12;
    let points = pts.map(p => ({{...p}}));
    // 保留原始錨點：這些點絕不能移動（它們連到節點）
    const startAnchor = {{...points[0]}};
    const endAnchor = {{...points[points.length - 1]}};

    // 區段（groupBox）障礙：不包含任一端點的 groupBoxes。
    // 略過 PE 群組，因為 PE 類型的邊本來就會穿過它。
    const _fromGrp = _nodeGrp[fromId];
    const _toGrp = _nodeGrp[toId];
    const sectionObstacles = [];
    for (let gi = 0; gi < groupBoxes.length; gi++) {{
      if (gi === _fromGrp || gi === _toGrp) continue;
      const gb = groupBoxes[gi];
      if (gb.isPE) continue;
      sectionObstacles.push(gb);
    }}

    // 輔助：若區段繞路座標落在 VNet 矩形內，且任一端點在 VNet 外，
    // 就把繞路推到較近的 VNet 邊之外，避免穿越無關的 VNet 內部。
    function _clampOutsideVNet(val, axis) {{
      if (!_vnetBounds) return val;
      const inAnchor = (a) => (a.x > _vnetBounds.x && a.x < _vnetBounds.x + _vnetBounds.w
                            && a.y > _vnetBounds.y && a.y < _vnetBounds.y + _vnetBounds.h);
      const srcOut = !inAnchor(startAnchor);
      const dstOut = !inAnchor(endAnchor);
      if (!srcOut && !dstOut) return val;
      if (axis === 'x') {{
        const L = _vnetBounds.x, R = _vnetBounds.x + _vnetBounds.w;
        if (val > L && val < R) return (val - L) <= (R - val) ? L - SECTION_MARGIN : R + SECTION_MARGIN;
      }} else {{
        const T = _vnetBounds.y, B = _vnetBounds.y + _vnetBounds.h;
        if (val > T && val < B) return (val - T) <= (B - val) ? T - SECTION_MARGIN : B + SECTION_MARGIN;
      }}
      return val;
    }}

    for (let iter = 0; iter < 20; iter++) {{
      let found = false;

      for (let i = 0; i < points.length - 1 && !found; i++) {{
        const p1 = points[i], p2 = points[i+1];

        // 1) 區段障礙（較大，優先檢查）
        for (const gb of sectionObstacles) {{
          const pos = {{x: gb.x, y: gb.y}};
          if (!segHitsNode(p1.x, p1.y, p2.x, p2.y, pos, gb.w, gb.h, SECTION_MARGIN)) continue;

          found = true;
          const isVert = Math.abs(p1.x - p2.x) < 1;
          const isFirst = (i === 0);
          const isLast = (i + 1 === points.length - 1);

          if (points.length <= 2) {{
            if (isVert) {{
              const leftX = gb.x - SECTION_MARGIN;
              const rightX = gb.x + gb.w + SECTION_MARGIN;
              let detourX = Math.abs(p1.x - leftX) <= Math.abs(p1.x - rightX) ? leftX : rightX;
              detourX = _clampOutsideVNet(detourX, 'x');
              points = [points[0], {{x: detourX, y: p1.y}}, {{x: detourX, y: p2.y}}, points[points.length-1]];
            }} else {{
              const topY = gb.y - SECTION_MARGIN;
              const bottomY = gb.y + gb.h + SECTION_MARGIN;
              let detourY = Math.abs(p1.y - topY) <= Math.abs(p1.y - bottomY) ? topY : bottomY;
              detourY = _clampOutsideVNet(detourY, 'y');
              points = [points[0], {{x: p1.x, y: detourY}}, {{x: p2.x, y: detourY}}, points[points.length-1]];
            }}
          }} else if (isFirst) {{
            if (isVert) {{
              const leftX = gb.x - SECTION_MARGIN;
              const rightX = gb.x + gb.w + SECTION_MARGIN;
              let detourX = Math.abs(p1.x - leftX) <= Math.abs(p1.x - rightX) ? leftX : rightX;
              detourX = _clampOutsideVNet(detourX, 'x');
              points.splice(1, 0, {{x: p1.x, y: p1.y}}, {{x: detourX, y: p1.y}});
              points[3] = {{x: detourX, y: p2.y}};
            }} else {{
              const topY = gb.y - SECTION_MARGIN;
              const bottomY = gb.y + gb.h + SECTION_MARGIN;
              let detourY = Math.abs(p1.y - topY) <= Math.abs(p1.y - bottomY) ? topY : bottomY;
              detourY = _clampOutsideVNet(detourY, 'y');
              points.splice(1, 0, {{x: p1.x, y: detourY}});
              points[2] = {{x: p2.x, y: detourY}};
            }}
          }} else if (isLast) {{
            if (isVert) {{
              const leftX = gb.x - SECTION_MARGIN;
              const rightX = gb.x + gb.w + SECTION_MARGIN;
              let detourX = Math.abs(p1.x - leftX) <= Math.abs(p1.x - rightX) ? leftX : rightX;
              detourX = _clampOutsideVNet(detourX, 'x');
              points[i] = {{x: detourX, y: p1.y}};
              points.splice(i + 1, 0, {{x: detourX, y: p2.y}}, {{x: p2.x, y: p2.y}});
            }} else {{
              const topY = gb.y - SECTION_MARGIN;
              const bottomY = gb.y + gb.h + SECTION_MARGIN;
              let detourY = Math.abs(p1.y - topY) <= Math.abs(p1.y - bottomY) ? topY : bottomY;
              detourY = _clampOutsideVNet(detourY, 'y');
              points[i] = {{x: p1.x, y: detourY}};
              points.splice(i + 1, 0, {{x: p2.x, y: detourY}});
            }}
          }} else {{
            if (isVert) {{
              const leftX = gb.x - SECTION_MARGIN;
              const rightX = gb.x + gb.w + SECTION_MARGIN;
              let newX = Math.abs(p1.x - leftX) <= Math.abs(p1.x - rightX) ? leftX : rightX;
              newX = _clampOutsideVNet(newX, 'x');
              points[i] = {{ x: newX, y: p1.y }};
              points[i+1] = {{ x: newX, y: p2.y }};
            }} else {{
              const topY = gb.y - SECTION_MARGIN;
              const bottomY = gb.y + gb.h + SECTION_MARGIN;
              let newY = Math.abs(p1.y - topY) <= Math.abs(p1.y - bottomY) ? topY : bottomY;
              newY = _clampOutsideVNet(newY, 'y');
              points[i] = {{ x: p1.x, y: newY }};
              points[i+1] = {{ x: p2.x, y: newY }};
            }}
          }}
          break;
        }}
        if (found) break;

        // 2) 服務節點障礙
        for (const node of NODES) {{
          if (node.id === fromId || node.id === toId) continue;
          const pos = positions[node.id];
          if (!pos) continue;
          const nw = node.type === 'pe' ? PE_W : SVC_W;
          const nh = (node.type === 'pe' ? PE_H : SVC_H) + 20; // 包含方塊下方文字

          if (!segHitsNode(p1.x, p1.y, p2.x, p2.y, pos, nw, nh, MARGIN)) continue;

          found = true;
          const isVert = Math.abs(p1.x - p2.x) < 1;
          const isFirst = (i === 0);
          const isLast = (i + 1 === points.length - 1);

          if (points.length <= 2) {{
            // 直線碰到節點：改成 4 點繞路（保留錨點）
            if (isVert) {{
              const leftX = pos.x - MARGIN;
              const rightX = pos.x + nw + MARGIN;
              const detourX = Math.abs(p1.x - leftX) <= Math.abs(p1.x - rightX) ? leftX : rightX;
              points = [points[0], {{x: detourX, y: p1.y}}, {{x: detourX, y: p2.y}}, points[points.length-1]];
            }} else {{
              const topY = pos.y - MARGIN;
              const bottomY = pos.y + nh + MARGIN;
              const detourY = Math.abs(p1.y - topY) <= Math.abs(p1.y - bottomY) ? topY : bottomY;
              points = [points[0], {{x: p1.x, y: detourY}}, {{x: p2.x, y: detourY}}, points[points.length-1]];
            }}
          }} else if (isFirst) {{
            // 第一段碰撞：保留 points[0]（錨點），在後面插入繞路
            if (isVert) {{
              const leftX = pos.x - MARGIN;
              const rightX = pos.x + nw + MARGIN;
              const detourX = Math.abs(p1.x - leftX) <= Math.abs(p1.x - rightX) ? leftX : rightX;
              points.splice(1, 0, {{x: p1.x, y: p1.y}}, {{x: detourX, y: p1.y}});
              points[3] = {{x: detourX, y: p2.y}};
            }} else {{
              const topY = pos.y - MARGIN;
              const bottomY = pos.y + nh + MARGIN;
              const detourY = Math.abs(p1.y - topY) <= Math.abs(p1.y - bottomY) ? topY : bottomY;
              points.splice(1, 0, {{x: p1.x, y: detourY}});
              points[2] = {{x: p2.x, y: detourY}};
            }}
          }} else if (isLast) {{
            // 最後一段碰撞：保留最後一點（錨點），在前面插入繞路
            if (isVert) {{
              const leftX = pos.x - MARGIN;
              const rightX = pos.x + nw + MARGIN;
              const detourX = Math.abs(p1.x - leftX) <= Math.abs(p1.x - rightX) ? leftX : rightX;
              points[i] = {{x: detourX, y: p1.y}};
              points.splice(i + 1, 0, {{x: detourX, y: p2.y}}, {{x: p2.x, y: p2.y}});
            }} else {{
              const topY = pos.y - MARGIN;
              const bottomY = pos.y + nh + MARGIN;
              const detourY = Math.abs(p1.y - topY) <= Math.abs(p1.y - bottomY) ? topY : bottomY;
              points[i] = {{x: p1.x, y: detourY}};
              points.splice(i + 1, 0, {{x: p2.x, y: detourY}});
            }}
          }} else {{
            // 中間段：可安全推動兩個端點
            if (isVert) {{
              const leftX = pos.x - MARGIN;
              const rightX = pos.x + nw + MARGIN;
              const newX = Math.abs(p1.x - leftX) <= Math.abs(p1.x - rightX) ? leftX : rightX;
              points[i] = {{ x: newX, y: p1.y }};
              points[i+1] = {{ x: newX, y: p2.y }};
            }} else {{
              const topY = pos.y - MARGIN;
              const bottomY = pos.y + nh + MARGIN;
              const newY = Math.abs(p1.y - topY) <= Math.abs(p1.y - bottomY) ? topY : bottomY;
              points[i] = {{ x: p1.x, y: newY }};
              points[i+1] = {{ x: p2.x, y: newY }};
            }}
          }}
          break;
        }}
      }}

      if (!found) break;
    }}

    // 還原錨點：保證線條一定連到來源/目標節點
    points[0] = startAnchor;
    points[points.length - 1] = endAnchor;

    return points;
  }}

  // ── 邊：三階段渲染 ──
  // Phase 0：預掃描離開邊 → Phase 1：以錯開錨點計算路徑
  // Phase 2：偵測交叉 → Phase 3：以橋接弧線渲染
  const _edgeLabels = [];

  // PHASE 0 — 預掃描：統計每個節點各邊離開的邊數
  const _sideTotal = {{}};
  const _edgeSides = [];
  EDGES.forEach(edge => {{
    const fn = NODES.find(n => n.id === edge.from);
    const tn = NODES.find(n => n.id === edge.to);
    if (!fn || !tn) {{ _edgeSides.push(null); return; }}
    const fromBox = getNodeBox(fn);
    const toBox = getNodeBox(tn);
    if (!fromBox || !toBox) {{ _edgeSides.push(null); return; }}

    const isPeEdge = edge.type === 'private';
    let exitSide, entrySide;
    if (isPeEdge) {{
      exitSide = 'bottom'; entrySide = 'top';
    }} else {{
      const dx = toBox.cx - fromBox.cx;
      const dy = toBox.cy - fromBox.cy;
      if (Math.abs(dx) >= Math.abs(dy)) {{
        exitSide = dx >= 0 ? 'right' : 'left';
        entrySide = dx >= 0 ? 'left' : 'right';
      }} else {{
        exitSide = dy >= 0 ? 'bottom' : 'top';
        entrySide = dy >= 0 ? 'top' : 'bottom';
      }}
    }}
    const ek = `${{edge.from}}_${{exitSide}}`;
    const nk = `${{edge.to}}_${{entrySide}}`;
    _sideTotal[ek] = (_sideTotal[ek] || 0) + 1;
    _sideTotal[nk] = (_sideTotal[nk] || 0) + 1;
    _edgeSides.push({{ exitSide, entrySide, isPeEdge, fromBox, toBox, edge }});
  }});

  // ── RACK MARSHALLING：建立群組間邊束流的通道對應 ──
  // 步驟 1：將每個節點對應到所屬群組框
  const _nodeGrp = {{}};
  NODES.forEach(n => {{
    const pos = positions[n.id];
    if (!pos) return;
    const nw = n.type === 'pe' ? PE_W : SVC_W;
    const nh = n.type === 'pe' ? PE_H : SVC_H;
    const cx = pos.x + nw / 2, cy = pos.y + nh / 2;
    for (let gi = 0; gi < groupBoxes.length; gi++) {{
      const gb = groupBoxes[gi];
      if (cx >= gb.x && cx <= gb.x + gb.w && cy >= gb.y && cy <= gb.y + gb.h) {{
        _nodeGrp[n.id] = gi; break;
      }}
    }}
  }});

  // 步驟 2：找出群組對之間的通道並分配槽位偏移
  const _chMap = {{}};       // key → {{ axis:'y'|'x', value: number }}
  const _chEdges = {{}};     // key → [edgeIdx, ...]
  _edgeSides.forEach((info, idx) => {{
    if (!info || info.isPeEdge) return;
    const sg = _nodeGrp[info.edge.from], tg = _nodeGrp[info.edge.to];
    if (sg === undefined || tg === undefined) return;

    let key;
    if (sg !== tg) {{
      key = Math.min(sg, tg) + '_' + Math.max(sg, tg);
      if (!_chEdges[key]) _chEdges[key] = [];
      _chEdges[key].push(idx);
      if (!_chMap[key]) {{
        const a = groupBoxes[sg], b = groupBoxes[tg];
        if (a.y + a.h <= b.y)      _chMap[key] = {{ axis: 'y', value: (a.y + a.h + b.y) / 2 }};
        else if (b.y + b.h <= a.y) _chMap[key] = {{ axis: 'y', value: (b.y + b.h + a.y) / 2 }};
        else if (a.x + a.w <= b.x) _chMap[key] = {{ axis: 'x', value: (a.x + a.w + b.x) / 2 }};
        else if (b.x + b.w <= a.x) _chMap[key] = {{ axis: 'x', value: (b.x + b.w + a.x) / 2 }};
      }}
    }} else {{
      // 群組內的邊：依方向分組以分配槽位偏移
      const dir = (info.exitSide === 'bottom' || info.exitSide === 'top') ? 'v' : 'h';
      key = 'i' + sg + dir;
      if (!_chEdges[key]) _chEdges[key] = [];
      _chEdges[key].push(idx);
      // 沒有固定通道值：每條邊各自使用自己的中點 + 偏移
    }}
  }});

  // 步驟 3：在每個通道內排序邊並分配槽位偏移
  const _chOff = {{}};  // edgeIdx → offset in px
  const _CH_SLOT = 18;  // spacing between lines in a bundle
  Object.keys(_chEdges).forEach(key => {{
    const ch = _chMap[key];
    const arr = _chEdges[key];
    const isVert = ch ? ch.axis === 'y' : key.endsWith('v');
    arr.sort((a, b) => {{
      const ia = _edgeSides[a], ib = _edgeSides[b];
      if (isVert) return (ia.fromBox.cx + ia.toBox.cx) - (ib.fromBox.cx + ib.toBox.cx);
      return (ia.fromBox.cy + ia.toBox.cy) - (ib.fromBox.cy + ib.toBox.cy);
    }});
    const n = arr.length;
    arr.forEach((ei, slot) => {{
      _chOff[ei] = n > 1 ? (slot - (n - 1) / 2) * _CH_SLOT : 0;
    }});
  }});

  // 錯開邊界出口：把多條邊平均分散到節點邊上
  const _sideUsed = {{}};
  function staggeredExit(nodeId, box, side) {{
    const key = `${{nodeId}}_${{side}}`;
    const total = _sideTotal[key] || 1;
    const idx = _sideUsed[key] || 0;
    _sideUsed[key] = idx + 1;
    const isH = (side === 'top' || side === 'bottom');
    const sideLen = isH ? box.w : box.h;
    const CM = Math.max(40, sideLen * 0.3); // corner margin — 40px min or 30% of side
    const usable = Math.max(0, sideLen - 2 * CM);
    const maxSpread = Math.min(usable, total * 14);
    const step = total > 1 ? maxSpread / (total - 1) : 0;
    const offset = total > 1 ? -maxSpread / 2 + idx * step : 0;
    if (side === 'top') return {{ x: Math.max(box.x + CM, Math.min(box.x + box.w - CM, box.cx + offset)), y: box.y }};
    if (side === 'bottom') return {{ x: Math.max(box.x + CM, Math.min(box.x + box.w - CM, box.cx + offset)), y: box.y + box.h }};
    if (side === 'left') return {{ x: box.x, y: Math.max(box.y + CM, Math.min(box.y + box.h - CM, box.cy + offset)) }};
    return {{ x: box.x + box.w, y: Math.max(box.y + CM, Math.min(box.y + box.h - CM, box.cy + offset)) }};
  }}

  // PHASE 1 — 以錯開錨點計算邊路徑
  const _allEdgePaths = [];
  _edgeSides.forEach((info, idx) => {{
    if (!info) return;
    const {{ exitSide, entrySide, isPeEdge, fromBox, toBox, edge }} = info;
    let pts;

    if (isPeEdge) {{
      const sp = staggeredExit(edge.from, fromBox, 'bottom');
      const ep = staggeredExit(edge.to, toBox, 'top');
      if (Math.abs(sp.x - ep.x) < 8) {{
        pts = [sp, ep];
      }} else {{
        let midY = (sp.y + ep.y) / 2;
        midY = Math.max(midY, fromBox.y + fromBox.h + 40);
        midY = Math.min(midY, toBox.y - 40);
        pts = [sp, {{x: sp.x, y: midY}}, {{x: ep.x, y: midY}}, ep];
      }}
      pts = avoidNodes(pts, edge.from, edge.to);
    }} else {{
      const sp = staggeredExit(edge.from, fromBox, exitSide);
      const ep = staggeredExit(edge.to, toBox, entrySide);
      const STUB = 40;

      // 查找群組間 marshalling 的通道
      const _sg = _nodeGrp[edge.from], _tg = _nodeGrp[edge.to];
      const _ck = _sg !== undefined && _tg !== undefined && _sg !== _tg
        ? Math.min(_sg, _tg) + '_' + Math.max(_sg, _tg) : null;
      const _cc = _ck ? _chMap[_ck] : null;
      const _co = _chOff[idx] || 0;

      if (exitSide === 'right' || exitSide === 'left') {{
        if (Math.abs(sp.y - ep.y) < 8) {{
          pts = [sp, ep];
        }} else {{
          let midX = (_cc && _cc.axis === 'x') ? _cc.value + _co : (sp.x + ep.x) / 2 + _co;
          if (exitSide === 'right') midX = Math.max(midX, fromBox.x + fromBox.w + STUB);
          if (exitSide === 'left') midX = Math.min(midX, fromBox.x - STUB);
          if (entrySide === 'right') midX = Math.max(midX, toBox.x + toBox.w + STUB);
          if (entrySide === 'left') midX = Math.min(midX, toBox.x - STUB);
          pts = [sp, {{x: midX, y: sp.y}}, {{x: midX, y: ep.y}}, ep];
        }}
      }} else {{
        if (Math.abs(sp.x - ep.x) < 8) {{
          pts = [sp, ep];
        }} else {{
          let midY = (_cc && _cc.axis === 'y') ? _cc.value + _co : (sp.y + ep.y) / 2 + _co;
          if (exitSide === 'bottom') midY = Math.max(midY, fromBox.y + fromBox.h + STUB);
          if (exitSide === 'top') midY = Math.min(midY, fromBox.y - STUB);
          if (entrySide === 'bottom') midY = Math.max(midY, toBox.y + toBox.h + STUB);
          if (entrySide === 'top') midY = Math.min(midY, toBox.y - STUB);
          pts = [sp, {{x: sp.x, y: midY}}, {{x: ep.x, y: midY}}, ep];
        }}
      }}

      pts = avoidNodes(pts, edge.from, edge.to);
    }}

    // POST-ROUTING：在出口與入口端強制加上垂直短段
    // 3 種情況：(a) 已正交且夠長 → 略過
    //           (b) 已正交但太短 → 延伸既有轉點
    //           (c) 非正交 → 插入 2 點連接器
    const _eSide = isPeEdge ? 'bottom' : exitSide;
    const _nSide = isPeEdge ? 'top' : entrySide;
    const _STUB = 40;
    if (pts.length >= 3) {{
      // --- 出口端 ---
      const _p0 = pts[0], _p1 = pts[1];
      const _eH = (_eSide === 'right' || _eSide === 'left');
      if (_eH) {{
        const _d = _eSide === 'right' ? 1 : -1;
        const _ortho = Math.abs(_p0.y - _p1.y) <= 1;
        if (_ortho) {{
          const _dist = (_p1.x - _p0.x) * _d;
          if (_dist < _STUB) {{
            const sx = _p0.x + _d * _STUB;
            pts[1] = {{x: sx, y: _p0.y}};
            if (pts.length > 2 && Math.abs(pts[2].x - _p1.x) <= 1) {{
              pts[2] = {{x: sx, y: pts[2].y}};
            }}
          }}
        }} else {{
          const sx = _p0.x + _d * _STUB;
          pts.splice(1, 0, {{x: sx, y: _p0.y}}, {{x: sx, y: _p1.y}});
        }}
      }} else {{
        const _d = _eSide === 'bottom' ? 1 : -1;
        const _ortho = Math.abs(_p0.x - _p1.x) <= 1;
        if (_ortho) {{
          const _dist = (_p1.y - _p0.y) * _d;
          if (_dist < _STUB) {{
            const sy = _p0.y + _d * _STUB;
            pts[1] = {{x: _p0.x, y: sy}};
            if (pts.length > 2 && Math.abs(pts[2].y - _p1.y) <= 1) {{
              pts[2] = {{x: pts[2].x, y: sy}};
            }}
          }}
        }} else {{
          const sy = _p0.y + _d * _STUB;
          pts.splice(1, 0, {{x: _p0.x, y: sy}}, {{x: _p1.x, y: sy}});
        }}
      }}
      // --- 入口端 ---
      const _pN = pts[pts.length - 1], _pP = pts[pts.length - 2];
      const _nH = (_nSide === 'right' || _nSide === 'left');
      if (_nH) {{
        const _d = _nSide === 'left' ? -1 : 1;
        const _ortho = Math.abs(_pN.y - _pP.y) <= 1;
        if (_ortho) {{
          const _dist = (_pP.x - _pN.x) * _d;
          if (_dist < _STUB) {{
            const sx = _pN.x + _d * _STUB;
            const _idx = pts.length - 2;
            pts[_idx] = {{x: sx, y: _pN.y}};
            if (_idx > 0 && Math.abs(pts[_idx - 1].x - _pP.x) <= 1) {{
              pts[_idx - 1] = {{x: sx, y: pts[_idx - 1].y}};
            }}
          }}
        }} else {{
          const sx = _pN.x + _d * _STUB;
          pts.splice(pts.length - 1, 0, {{x: sx, y: _pP.y}}, {{x: sx, y: _pN.y}});
        }}
      }} else {{
        const _d = _nSide === 'top' ? -1 : 1;
        const _ortho = Math.abs(_pN.x - _pP.x) <= 1;
        if (_ortho) {{
          const _dist = (_pP.y - _pN.y) * _d;
          if (_dist < _STUB) {{
            const sy = _pN.y + _d * _STUB;
            const _idx = pts.length - 2;
            pts[_idx] = {{x: _pN.x, y: sy}};
            if (_idx > 0 && Math.abs(pts[_idx - 1].y - _pP.y) <= 1) {{
              pts[_idx - 1] = {{x: pts[_idx - 1].x, y: sy}};
            }}
          }}
        }} else {{
          const sy = _pN.y + _d * _STUB;
          pts.splice(pts.length - 1, 0, {{x: _pP.x, y: sy}}, {{x: _pN.x, y: sy}});
        }}
      }}
    }}

    // 安全措施：把任何剩餘的斜向線段拆成正交 L 形
    for (let _i = 0; _i < pts.length - 1; _i++) {{
      const _a = pts[_i], _b = pts[_i + 1];
      if (Math.abs(_a.x - _b.x) > 1 && Math.abs(_a.y - _b.y) > 1) {{
        pts.splice(_i + 1, 0, {{x: _a.x, y: _b.y}});
      }}
    }}

    // 簡化：移除重複與共線的中間點
    for (let _i = pts.length - 2; _i >= 1; _i--) {{
      const _a = pts[_i - 1], _b = pts[_i], _c = pts[_i + 1];
      if (Math.abs(_a.x - _b.x) <= 1 && Math.abs(_a.y - _b.y) <= 1) {{
        pts.splice(_i, 1); continue;
      }}
      if ((Math.abs(_a.x - _b.x) <= 1 && Math.abs(_b.x - _c.x) <= 1) ||
          (Math.abs(_a.y - _b.y) <= 1 && Math.abs(_b.y - _c.y) <= 1)) {{
        pts.splice(_i, 1);
      }}
    }}

    _allEdgePaths.push({{ edge, pts, isPeEdge }});
  }});

  // 重疊分離：把共線且重疊的線段分開
  // 只分離距離小於 OSEP 的線段；預先 marshalling 的邊（相距 16px）不受影響
  const OSEP = 8;
  for (let pass = 0; pass < 4; pass++) {{
    for (let i = 0; i < _allEdgePaths.length; i++) {{
      for (let j = i + 1; j < _allEdgePaths.length; j++) {{
        const pA = _allEdgePaths[i].pts;
        const pB = _allEdgePaths[j].pts;
        const dir = (j % 2 === 0) ? 1 : -1;
        for (let si = 0; si < pA.length - 1; si++) {{
          for (let sj = 0; sj < pB.length - 1; sj++) {{
            const a1 = pA[si], a2 = pA[si + 1];
            const b1 = pB[sj], b2 = pB[sj + 1];
            const aV = Math.abs(a1.x - a2.x) < 2;
            const bV = Math.abs(b1.x - b2.x) < 2;
            const aH = Math.abs(a1.y - a2.y) < 2;
            const bH = Math.abs(b1.y - b2.y) < 2;

            if (aV && bV && Math.abs(a1.x - b1.x) < OSEP) {{
              const ov = Math.min(Math.max(a1.y, a2.y), Math.max(b1.y, b2.y))
                       - Math.max(Math.min(a1.y, a2.y), Math.min(b1.y, b2.y));
              if (ov > 10) {{
                let shift = OSEP * dir;
                if (b1.x + shift < 20) shift = Math.abs(shift);
                if (sj > 0) pB[sj] = {{ x: b1.x + shift, y: b1.y }};
                if (sj + 1 < pB.length - 1) pB[sj + 1] = {{ x: b2.x + shift, y: b2.y }};
              }}
            }}
            if (aH && bH && Math.abs(a1.y - b1.y) < OSEP) {{
              const ov = Math.min(Math.max(a1.x, a2.x), Math.max(b1.x, b2.x))
                       - Math.max(Math.min(a1.x, a2.x), Math.min(b1.x, b2.x));
              if (ov > 10) {{
                const shift = OSEP * dir;
                if (sj > 0) pB[sj] = {{ x: b1.x, y: b1.y + shift }};
                if (sj + 1 < pB.length - 1) pB[sj + 1] = {{ x: b2.x, y: b2.y + shift }};
              }}
            }}
          }}
        }}
      }}
    }}
  }}

  // 最終正交化：修正重疊分離產生的斜線
  _allEdgePaths.forEach(({{ pts }}) => {{
    for (let _i = 0; _i < pts.length - 1; _i++) {{
      const _a = pts[_i], _b = pts[_i + 1];
      if (Math.abs(_a.x - _b.x) > 1 && Math.abs(_a.y - _b.y) > 1) {{
        pts.splice(_i + 1, 0, {{x: _a.x, y: _b.y}});
      }}
    }}
    // 移除共線點
    for (let _i = pts.length - 2; _i >= 1; _i--) {{
      const _a = pts[_i - 1], _b = pts[_i], _c = pts[_i + 1];
      if (Math.abs(_a.x - _b.x) <= 1 && Math.abs(_a.y - _b.y) <= 1) {{
        pts.splice(_i, 1); continue;
      }}
      if ((Math.abs(_a.x - _b.x) <= 1 && Math.abs(_b.x - _c.x) <= 1) ||
          (Math.abs(_a.y - _b.y) <= 1 && Math.abs(_b.y - _c.y) <= 1)) {{
        pts.splice(_i, 1);
      }}
    }}
  }});

  // ── 重新路由階段：透過外側邊距降低交叉 ──
  // 不採用最短路徑，而是把交叉的邊繞過群組框外圍
  const _gbLeft = groupBoxes.length > 0 ? Math.min(...groupBoxes.map(g => g.x)) : 0;
  const _gbRight = groupBoxes.length > 0 ? Math.max(...groupBoxes.map(g => g.x + g.w)) : 800;
  const _gbTop = groupBoxes.length > 0 ? Math.min(...groupBoxes.map(g => g.y)) : 0;
  const _gbBottom = groupBoxes.length > 0 ? Math.max(...groupBoxes.map(g => g.y + g.h)) : 600;
  const _RMARGIN = 50; // 群組框外側的邊距，用於改道邊
  const _RM_SLOT = 14; // 同一邊距上改道邊之間的間距

  // 計算某條邊與其他所有邊之間的 H×V 交叉
  function _cntCross(eIdx) {{
    let c = 0;
    const pA = _allEdgePaths[eIdx].pts;
    for (let j = 0; j < _allEdgePaths.length; j++) {{
      if (j === eIdx) continue;
      const pB = _allEdgePaths[j].pts;
      for (let si = 0; si < pA.length - 1; si++) {{
        for (let sj = 0; sj < pB.length - 1; sj++) {{
          if (findSegCrossing(pA[si].x, pA[si].y, pA[si+1].x, pA[si+1].y,
                              pB[sj].x, pB[sj].y, pB[sj+1].x, pB[sj+1].y)) c++;
        }}
      }}
    }}
    return c;
  }}

  // 產生邊距路徑：sp → 短段 → 邊距 → 邊距 → 短段 → ep
  function _mRoute(sp, ep, exitSide, entrySide, side, slotOff) {{
    const S = 40; // 短段長度
    const so = slotOff || 0;
    // 從來源節點拉出短段
    const s1 = exitSide === 'bottom' ? {{x: sp.x, y: sp.y + S}}
             : exitSide === 'top'    ? {{x: sp.x, y: sp.y - S}}
             : exitSide === 'right'  ? {{x: sp.x + S, y: sp.y}}
             :                         {{x: sp.x - S, y: sp.y}};
    // 接到目標節點的短段
    const s2 = entrySide === 'top'    ? {{x: ep.x, y: ep.y - S}}
             : entrySide === 'bottom' ? {{x: ep.x, y: ep.y + S}}
             : entrySide === 'left'   ? {{x: ep.x - S, y: ep.y}}
             :                          {{x: ep.x + S, y: ep.y}};
    if (side === 'left') {{
      const mx = _gbLeft - _RMARGIN - so;
      return [sp, s1, {{x: mx, y: s1.y}}, {{x: mx, y: s2.y}}, s2, ep];
    }}
    if (side === 'right') {{
      const mx = _gbRight + _RMARGIN + so;
      return [sp, s1, {{x: mx, y: s1.y}}, {{x: mx, y: s2.y}}, s2, ep];
    }}
    if (side === 'top') {{
      const my = _gbTop - _RMARGIN - so;
      return [sp, s1, {{x: s1.x, y: my}}, {{x: s2.x, y: my}}, s2, ep];
    }}
    // 底部
    const my = _gbBottom + _RMARGIN + so;
    return [sp, s1, {{x: s1.x, y: my}}, {{x: s2.x, y: my}}, s2, ep];
  }}

  // 反覆透過邊距重新路由有交叉的邊
  const _marginUsed = {{ left: 0, right: 0, top: 0, bottom: 0 }};
  const _tried = new Set();
  for (let _ri = 0; _ri < 30; _ri++) {{
    // 找出尚未嘗試過、交叉最多的邊
    let worstIdx = -1, worstCnt = 0;
    for (let i = 0; i < _allEdgePaths.length; i++) {{
      if (_allEdgePaths[i].isPeEdge || _tried.has(i)) continue;
      const cnt = _cntCross(i);
      if (cnt > worstCnt) {{ worstCnt = cnt; worstIdx = i; }}
    }}
    if (worstIdx < 0 || worstCnt === 0) break;

    const ei = _edgeSides[worstIdx];
    if (!ei) {{ _tried.add(worstIdx); continue; }}
    const origPts = _allEdgePaths[worstIdx].pts;
    const sp = origPts[0];
    const ep = origPts[origPts.length - 1];
    let bestPts = origPts, bestCnt = worstCnt, bestSide = null;

    // 計算各邊距的跨度寬度，以分配適當的槽位深度
    for (const side of ['left', 'right', 'top', 'bottom']) {{
      const alt = _mRoute(sp, ep, ei.exitSide, ei.entrySide, side, _marginUsed[side]);
      _allEdgePaths[worstIdx].pts = alt;
      const cnt = _cntCross(worstIdx);
      _allEdgePaths[worstIdx].pts = origPts;
      if (cnt < bestCnt) {{
        bestCnt = cnt; bestPts = alt; bestSide = side;
      }}
    }}

    if (bestSide && bestCnt < worstCnt) {{
      _allEdgePaths[worstIdx].pts = bestPts;
      _marginUsed[bestSide] += _RM_SLOT;
    }} else {{
      _tried.add(worstIdx); // mark as cannot-improve, try next edge
    }}
  }}

  // POST-REROUTE：依跨度寬度排序同邊距的邊（最寬者最外側）
  // 避免同一邊距上的邊之間發生垂直線段交叉
  const _marginEdges = {{ left: [], right: [], top: [], bottom: [] }};
  for (let i = 0; i < _allEdgePaths.length; i++) {{
    const pts = _allEdgePaths[i].pts;
    if (pts.length !== 6) continue; // only margin-routed edges have 6 points
    // 偵測這條邊使用哪一側邊距
    const p2 = pts[2], p3 = pts[3];
    if (p2.y === p3.y) {{
      // 邊距上的水平線段 → top 或 bottom
      if (p2.y < _gbTop) {{ _marginEdges.top.push(i); }}
      else if (p2.y > _gbBottom) {{ _marginEdges.bottom.push(i); }}
    }} else if (p2.x === p3.x) {{
      // 邊距上的垂直線段 → left 或 right
      if (p2.x < _gbLeft) {{ _marginEdges.left.push(i); }}
      else if (p2.x > _gbRight) {{ _marginEdges.right.push(i); }}
    }}
  }}
  // 對每個邊距群組排序：跨度最寬 → 最外側槽位
  for (const side of ['left', 'right', 'top', 'bottom']) {{
    const idxs = _marginEdges[side];
    if (idxs.length < 2) continue;
    const isHoriz = (side === 'top' || side === 'bottom');
    // 計算每條邊的跨度
    const spans = idxs.map(i => {{
      const pts = _allEdgePaths[i].pts;
      return isHoriz
        ? Math.abs(pts[2].x - pts[3].x)
        : Math.abs(pts[2].y - pts[3].y);
    }});
    // 依跨度遞減排序索引（最寬者先 → 最外側）
    const sorted = idxs.map((idx, j) => ({{ idx, span: spans[j] }}))
                       .sort((a, b) => b.span - a.span);
    // 重新分配已排序邊的 y/x 位置
    const baseMargin = isHoriz
      ? (side === 'top' ? _gbTop - _RMARGIN : _gbBottom + _RMARGIN)
      : (side === 'left' ? _gbLeft - _RMARGIN : _gbRight + _RMARGIN);
    const dir = (side === 'top' || side === 'left') ? -1 : 1;
    sorted.forEach((s, k) => {{
      const pts = _allEdgePaths[s.idx].pts;
      const newM = baseMargin + dir * k * _RM_SLOT;
      if (isHoriz) {{
        pts[2].y = newM; pts[3].y = newM;
      }} else {{
        pts[2].x = newM; pts[3].x = newM;
      }}
    }});
  }}

  // BOTTOM-LANE REROUTER：以 marshalling 的 U 形方式處理
  // 把重疊的邊改道到所有區段下方等距排列的水平車道。
  // 能直落到節點下方時用 2 個轉折；只有受阻時才改成 4 個轉折。
  const OSEP2 = 14;
  const _bottomLaneBase = _gbBottom + _RMARGIN + 30;
  let _bottomSlot = 0;
  const _LANE_SPC = OSEP2; // 14px 車道間距：精準的 marshalling 風格
  const _COL_SPC = OSEP2; // 垂直通道之間的最小距離
  const _rerouted = new Set();
  const _usedCols = [];
  function _colUsed(cx) {{ for (const ux of _usedCols) {{ if (Math.abs(cx - ux) < _COL_SPC) return true; }} return false; }}
  // 檢查垂直欄位是否沒有節點與非豁免的區段框
  function _isColClear(cx, yMin, yMax, skipId1, skipId2, skipGbs) {{
    for (const _nd of NODES) {{
      if (_nd.id === skipId1 || _nd.id === skipId2) continue;
      const _np = positions[_nd.id]; if (!_np) continue;
      const _nw = _nd.type === 'pe' ? PE_W : SVC_W;
      const _nh = (_nd.type === 'pe' ? PE_H : SVC_H) + 20;
      const _pad = 6;
      if (cx > _np.x - _pad && cx < _np.x + _nw + _pad &&
          yMin < _np.y + _nh + _pad && yMax > _np.y - _pad) {{
        return false;
      }}
    }}
    for (const _gb of groupBoxes) {{
      if (skipGbs && skipGbs.indexOf(_gb) >= 0) continue;
      if (cx > _gb.x - 4 && cx < _gb.x + _gb.w + 4 &&
          yMin < _gb.y + _gb.h + 4 && yMax > _gb.y - 4) {{
        return false;
      }}
    }}
    return true;
  }}
  // 檢查水平列是否沒有節點與非豁免的區段框
  function _isRowClear(cy, xMin, xMax, skipId1, skipId2, skipGbs) {{
    for (const _nd of NODES) {{
      if (_nd.id === skipId1 || _nd.id === skipId2) continue;
      const _np = positions[_nd.id]; if (!_np) continue;
      const _nw = _nd.type === 'pe' ? PE_W : SVC_W;
      const _nh = (_nd.type === 'pe' ? PE_H : SVC_H) + 20;
      const _pad = 6;
      if (cy > _np.y - _pad && cy < _np.y + _nh + _pad &&
          xMin < _np.x + _nw + _pad && xMax > _np.x - _pad) {{
        return false;
      }}
    }}
    for (const _gb of groupBoxes) {{
      if (skipGbs && skipGbs.indexOf(_gb) >= 0) continue;
      if (cy > _gb.y - 4 && cy < _gb.y + _gb.h + 4 &&
          xMin < _gb.x + _gb.w + 4 && xMax > _gb.x - 4) {{
        return false;
      }}
    }}
    return true;
  }}
  function _findGb(px, py) {{
    for (const _gb of groupBoxes) {{
      if (px >= _gb.x && px <= _gb.x + _gb.w && py >= _gb.y && py <= _gb.y + _gb.h) return _gb;
    }}
    return null;
  }}
  // 從偏好 x 開始尋找最近的空白欄位，並跳過來源/目的區段
  function _findCol(prefX, yMin, yMax, skipId1, skipId2, skipGbs, preferDir) {{
    // 先嘗試偏好位置（直接從節點垂直下來）
    if (!_colUsed(prefX) && _isColClear(prefX, yMin, yMax, skipId1, skipId2, skipGbs)) return prefX;
    // 以小步距向外搜尋
    const _dirs = preferDir < 0 ? [-1, 1] : (preferDir > 0 ? [1, -1] : [-1, 1]);
    for (let _t = 1; _t <= 100; _t++) {{
      for (const _d of _dirs) {{
        const _cx = prefX + _d * _t * OSEP;
        if (_cx < 20) continue;
        if (_colUsed(_cx)) continue;
        if (_isColClear(_cx, yMin, yMax, skipId1, skipId2, skipGbs)) return _cx;
      }}
    }}
    return null;
  }}
  for (let _blPass = 0; _blPass < 20; _blPass++) {{
    let _worstEdge = -1, _worstCount = 0;
    for (let i = 0; i < _allEdgePaths.length; i++) {{
      if (_rerouted.has(i)) continue;
      let cnt = 0;
      const pB = _allEdgePaths[i].pts;
      for (let j = 0; j < _allEdgePaths.length; j++) {{
        if (j === i) continue;
        const pA = _allEdgePaths[j].pts;
        let maxOv = 0;
        for (let si = 0; si < pA.length - 1; si++) {{
          for (let sj = 0; sj < pB.length - 1; sj++) {{
            const a1 = pA[si], a2 = pA[si + 1], b1 = pB[sj], b2 = pB[sj + 1];
            if (Math.abs(a1.y - a2.y) < 2 && Math.abs(b1.y - b2.y) < 2 && Math.abs(a1.y - b1.y) < OSEP2) {{
              const ov = Math.min(Math.max(a1.x, a2.x), Math.max(b1.x, b2.x))
                       - Math.max(Math.min(a1.x, a2.x), Math.min(b1.x, b2.x));
              if (ov > maxOv) maxOv = ov;
            }}
            if (Math.abs(a1.x - a2.x) < 2 && Math.abs(b1.x - b2.x) < 2 && Math.abs(a1.x - b1.x) < OSEP2) {{
              const ov = Math.min(Math.max(a1.y, a2.y), Math.max(b1.y, b2.y))
                       - Math.max(Math.min(a1.y, a2.y), Math.min(b1.y, b2.y));
              if (ov > maxOv) maxOv = ov;
            }}
          }}
        }}
        if (maxOv > 20) cnt++;
      }}
      if (cnt > _worstCount) {{ _worstCount = cnt; _worstEdge = i; }}
    }}
    if (_worstEdge < 0) break;
    const pB = _allEdgePaths[_worstEdge].pts;
    const _fromId = _allEdgePaths[_worstEdge].edge.from;
    const _toId = _allEdgePaths[_worstEdge].edge.to;
    const start = pB[0];
    const end = pB[pB.length - 1];
    // 來源/目的區段可豁免：垂直線可穿過自己的區段
    const srcGb = _findGb(start.x, start.y);
    const dstGb = _findGb(end.x, end.y);
    const skipGbs = [srcGb, dstGb].filter(g => g !== null);
    const _yMin = Math.min(start.y, end.y);
    const _yMax = Math.max(start.y, end.y);
    const _spanX = Math.abs(end.x - start.x);
    // 先偏好本地單欄改道，避免長距離的底部車道繞路。
    const _localPrefX = (start.x + end.x) / 2;
    const _localX = _findCol(_localPrefX, _yMin, _yMax, _fromId, _toId, skipGbs);
    const _localLimit = Math.max(_spanX + 40, 120);
    if (_localX !== null &&
        Math.abs(_localX - start.x) <= _localLimit &&
        Math.abs(_localX - end.x) <= _localLimit &&
        _isRowClear(start.y, Math.min(start.x, _localX), Math.max(start.x, _localX), _fromId, _toId, skipGbs) &&
        _isRowClear(end.y, Math.min(end.x, _localX), Math.max(end.x, _localX), _fromId, _toId, skipGbs)) {{
      _usedCols.push(_localX);
      pB.length = 0;
      pB.push(start);
      if (Math.abs(_localX - start.x) > 2) pB.push({{ x: _localX, y: start.y }});
      if (Math.abs(end.y - start.y) > 2) pB.push({{ x: _localX, y: end.y }});
      if (Math.abs(_localX - end.x) > 2) pB.push({{ x: _localX, y: end.y }});
      pB.push(end);
      _rerouted.add(_worstEdge);
      continue;
    }}
    const laneY = _bottomLaneBase + _bottomSlot * _LANE_SPC;
    const _towardEnd = end.x >= start.x ? 1 : -1;
    const _exitX = _findCol(start.x, Math.min(start.y, laneY), Math.max(start.y, laneY), _fromId, _toId, skipGbs, _towardEnd);
    const _enterX = _findCol(end.x, Math.min(end.y, laneY), Math.max(end.y, laneY), _fromId, _toId, skipGbs, -_towardEnd);
    if (_exitX === null || _enterX === null) {{
      _rerouted.add(_worstEdge);
      continue;
    }}
    _usedCols.push(_exitX);
    _usedCols.push(_enterX);
    _bottomSlot++;
    pB.length = 0;
    pB.push(start);
    // 只有在出口欄位與節點 x 不同時才加入水平短段
    if (Math.abs(_exitX - start.x) > 2) pB.push({{ x: _exitX, y: start.y }});
    pB.push({{ x: _exitX, y: laneY }});
    pB.push({{ x: _enterX, y: laneY }});
    if (Math.abs(_enterX - end.x) > 2) pB.push({{ x: _enterX, y: end.y }});
    pB.push(end);
    _rerouted.add(_worstEdge);
  }}
  // POST-REROUTE 重疊分離：把改道後的線段推開
  for (let _rSep = 0; _rSep < 6; _rSep++) {{
    for (let i = 0; i < _allEdgePaths.length; i++) {{
      for (let j = i + 1; j < _allEdgePaths.length; j++) {{
        const pA = _allEdgePaths[i].pts;
        const pB = _allEdgePaths[j].pts;
        // 分離所有邊對（不論是否改道），以處理改道後的重疊
        const dir = (j % 2 === 0) ? 1 : -1;
        for (let si = 0; si < pA.length - 1; si++) {{
          for (let sj = 0; sj < pB.length - 1; sj++) {{
            const a1 = pA[si], a2 = pA[si + 1];
            const b1 = pB[sj], b2 = pB[sj + 1];
            const aV = Math.abs(a1.x - a2.x) < 2;
            const bV = Math.abs(b1.x - b2.x) < 2;
            const aH = Math.abs(a1.y - a2.y) < 2;
            const bH = Math.abs(b1.y - b2.y) < 2;
            if (aV && bV && Math.abs(a1.x - b1.x) < OSEP2) {{
              const ov = Math.min(Math.max(a1.y, a2.y), Math.max(b1.y, b2.y))
                       - Math.max(Math.min(a1.y, a2.y), Math.min(b1.y, b2.y));
              if (ov > 10) {{
                let shift = OSEP2 * dir;
                if (b1.x + shift < 20) shift = Math.abs(shift);
                if (sj > 0) pB[sj] = {{ x: b1.x + shift, y: b1.y }};
                if (sj + 1 < pB.length - 1) pB[sj + 1] = {{ x: b2.x + shift, y: b2.y }};
              }}
            }}
            if (aH && bH && Math.abs(a1.y - b1.y) < OSEP2) {{
              const ov = Math.min(Math.max(a1.x, a2.x), Math.max(b1.x, b2.x))
                       - Math.max(Math.min(a1.x, a2.x), Math.min(b1.x, b2.x));
              if (ov > 10) {{
                const shift = OSEP2 * dir;
                if (sj > 0) pB[sj] = {{ x: b1.x, y: b1.y + shift }};
                if (sj + 1 < pB.length - 1) pB[sj + 1] = {{ x: b2.x, y: b2.y + shift }};
              }}
            }}
          }}
        }}
      }}
    }}
  }}
  // POST-REROUTE 正交化
  _allEdgePaths.forEach(({{ pts }}) => {{
    for (let _i = 0; _i < pts.length - 1; _i++) {{
      const _a = pts[_i], _b = pts[_i + 1];
      if (Math.abs(_a.x - _b.x) > 1 && Math.abs(_a.y - _b.y) > 1) {{
        pts.splice(_i + 1, 0, {{x: _a.x, y: _b.y}});
      }}
    }}
    for (let _i = pts.length - 2; _i >= 1; _i--) {{
      const _a = pts[_i - 1], _b = pts[_i], _c = pts[_i + 1];
      if (Math.abs(_a.x - _b.x) <= 1 && Math.abs(_a.y - _b.y) <= 1) {{
        pts.splice(_i, 1); continue;
      }}
      if ((Math.abs(_a.x - _b.x) <= 1 && Math.abs(_b.x - _c.x) <= 1) ||
          (Math.abs(_a.y - _b.y) <= 1 && Math.abs(_b.y - _c.y) <= 1)) {{
        pts.splice(_i, 1);
      }}
    }}
  }});

  // 最終重疊分離：補抓正交化重新產生的重疊
  for (let _fSep = 0; _fSep < 4; _fSep++) {{
    for (let i = 0; i < _allEdgePaths.length; i++) {{
      for (let j = i + 1; j < _allEdgePaths.length; j++) {{
        const pA = _allEdgePaths[i].pts;
        const pB = _allEdgePaths[j].pts;
        for (let si = 0; si < pA.length - 1; si++) {{
          for (let sj = 0; sj < pB.length - 1; sj++) {{
            const a1 = pA[si], a2 = pA[si + 1];
            const b1 = pB[sj], b2 = pB[sj + 1];
            const aH = Math.abs(a1.y - a2.y) < 2;
            const bH = Math.abs(b1.y - b2.y) < 2;
            const aV = Math.abs(a1.x - a2.x) < 2;
            const bV = Math.abs(b1.x - b2.x) < 2;
            if (aH && bH && Math.abs(a1.y - b1.y) < 6) {{
              const ov = Math.min(Math.max(a1.x, a2.x), Math.max(b1.x, b2.x))
                       - Math.max(Math.min(a1.x, a2.x), Math.min(b1.x, b2.x));
              if (ov > 20) {{
                const shift = 8 * ((j % 2 === 0) ? 1 : -1);
                if (sj > 0) pB[sj] = {{ x: b1.x, y: b1.y + shift }};
                if (sj + 1 < pB.length - 1) pB[sj + 1] = {{ x: b2.x, y: b2.y + shift }};
              }}
            }}
            if (aV && bV && Math.abs(a1.x - b1.x) < 6) {{
              const ov = Math.min(Math.max(a1.y, a2.y), Math.max(b1.y, b2.y))
                       - Math.max(Math.min(a1.y, a2.y), Math.min(b1.y, b2.y));
              if (ov > 20) {{
                let shift = 8 * ((j % 2 === 0) ? 1 : -1);
                if (b1.x + shift < 20) shift = Math.abs(shift);
                if (sj > 0) pB[sj] = {{ x: b1.x + shift, y: b1.y }};
                if (sj + 1 < pB.length - 1) pB[sj + 1] = {{ x: b2.x + shift, y: b2.y }};
              }}
            }}
          }}
        }}
      }}
    }}
  }}

  // 最終斜線切分器：把任何非正交線段切成 L 形。
  // 上面的分離流程在只移動單一端點時可能引入斜線。
  // 最後再把每段對齊座標軸作為安全網。
  for (const _ep of _allEdgePaths) {{
    const pts = _ep.pts;
    for (let k = 0; k < pts.length - 1; k++) {{
      const q1 = pts[k], q2 = pts[k + 1];
      const dx = q2.x - q1.x;
      const dy = q2.y - q1.y;
      if (Math.abs(dx) > 1 && Math.abs(dy) > 1) {{
        // 在 (q2.x, q1.y) 插入折角：保留端點，強制成 L 形。
        // 方向啟發式：先沿主軸方向前進。
        const elbow = Math.abs(dx) >= Math.abs(dy)
          ? {{ x: q2.x, y: q1.y }}
          : {{ x: q1.x, y: q2.y }};
        pts.splice(k + 1, 0, elbow);
        // 下一輪再檢查新插入的線段
      }}
    }}
  }}

  // 交叉偵測：找出彼此交叉的邊（用於顏色區分）
  const _crossNeighbors = {{}};
  for (let i = 0; i < _allEdgePaths.length; i++) {{
    for (let j = i + 1; j < _allEdgePaths.length; j++) {{
      const ptsA = _allEdgePaths[i].pts;
      const ptsB = _allEdgePaths[j].pts;
      let crossed = false;
      for (let si = 0; si < ptsA.length - 1 && !crossed; si++) {{
        for (let sj = 0; sj < ptsB.length - 1 && !crossed; sj++) {{
          if (findSegCrossing(
            ptsA[si].x, ptsA[si].y, ptsA[si + 1].x, ptsA[si + 1].y,
            ptsB[sj].x, ptsB[sj].y, ptsB[sj + 1].x, ptsB[sj + 1].y
          )) crossed = true;
        }}
      }}
      if (crossed) {{
        if (!_crossNeighbors[i]) _crossNeighbors[i] = new Set();
        if (!_crossNeighbors[j]) _crossNeighbors[j] = new Set();
        _crossNeighbors[i].add(j);
        _crossNeighbors[j].add(i);
      }}
    }}
  }}

  // 貪婪圖著色：交叉邊取得不同顏色
  const _CROSS_COLORS = ['#0078D4', '#E3008C', '#00B7C3', '#FF8C00', '#107C10', '#881798'];
  const _edgeColor = {{}};
  const crossingEdges = Object.keys(_crossNeighbors).map(Number)
    .sort((a, b) => _crossNeighbors[b].size - _crossNeighbors[a].size);
  crossingEdges.forEach(eIdx => {{
    const neighborColors = new Set();
    _crossNeighbors[eIdx].forEach(n => {{
      if (_edgeColor[n] !== undefined) neighborColors.add(_edgeColor[n]);
    }});
    let colorIdx = 0;
    while (neighborColors.has(colorIdx)) colorIdx++;
    _edgeColor[eIdx] = colorIdx;
  }});

  // 渲染邊：不使用橋接弧線，只以帶顏色的正交路徑呈現

  function renderEdge({{ edge, pts, isPeEdge, edgeIdx }}) {{
    let pathD;
    if (pts.length <= 2) {{
      pathD = `M ${{pts[0].x}} ${{pts[0].y}} L ${{pts[pts.length - 1].x}} ${{pts[pts.length - 1].y}}`;
    }} else {{
      pathD = buildOrthoPath(pts);
    }}

    // 決定邊的顏色：PE=紫色、交叉=彩色、一般=灰色
    let edgeStroke, edgeOpacity;
    if (isPeEdge) {{
      edgeStroke = '#5C2D91';
      edgeOpacity = '0.5';
    }} else if (_edgeColor[edgeIdx] !== undefined) {{
      edgeStroke = _CROSS_COLORS[_edgeColor[edgeIdx] % _CROSS_COLORS.length];
      edgeOpacity = '0.75';
    }} else {{
      edgeStroke = '#8a8886';
      edgeOpacity = '0.65';
    }}

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', edgeStroke);
    path.setAttribute('stroke-width', isPeEdge ? '1' : '1.2');
    path.setAttribute('stroke-dasharray', edge.dash || '0');
    path.setAttribute('marker-end', `url(#${{markerFor(edge.type)}})`);
    path.setAttribute('opacity', edgeOpacity);
    path.classList.add('edge-path');
    path.setAttribute('data-from', edge.from);
    path.setAttribute('data-to', edge.to);
    root.appendChild(path);

    // 標籤放置：考慮碰撞
    if (edge.label) {{
      const bw = edge.label.length * 5.5 + 10;
      const bh = 14;

      function labelHitsNode(lx, ly) {{
        return NODES.some(n => {{
          const p = positions[n.id];
          if (!p) return false;
          const nw = n.type === 'pe' ? PE_W : SVC_W;
          const nh = n.type === 'pe' ? PE_H : SVC_H;
          return lx + bw/2 > p.x && lx - bw/2 < p.x + nw
              && ly + bh/2 > p.y && ly - bh/2 < p.y + nh;
        }});
      }}

      const candidates = [];
      for (let s = 0; s < pts.length - 1; s++) {{
        const cx = (pts[s].x + pts[s + 1].x) / 2;
        const cy = (pts[s].y + pts[s + 1].y) / 2;
        const priority = Math.abs(s - (pts.length - 2) / 2);
        candidates.push({{ x: cx, y: cy, priority }});
      }}
      candidates.sort((a, b) => a.priority - b.priority);

      let chosen = candidates[0];
      for (const c of candidates) {{
        if (!labelHitsNode(c.x, c.y)) {{ chosen = c; break; }}
      }}

      if (labelHitsNode(chosen.x, chosen.y)) {{
        const offsets = [{{x:0,y:-20}},{{x:0,y:20}},{{x:-20,y:0}},{{x:20,y:0}}];
        for (const off of offsets) {{
          if (!labelHitsNode(chosen.x + off.x, chosen.y + off.y)) {{
            chosen = {{ x: chosen.x + off.x, y: chosen.y + off.y }};
            break;
          }}
        }}
      }}

      _edgeLabels.push({{ label: edge.label, x: chosen.x, y: chosen.y, from: edge.from, to: edge.to }});
    }}

    return {{ path, edge, pts }};
  }}

  // 渲染所有邊
  _allEdgePaths.forEach((ep, edgeIdx) => renderEdge({{ ...ep, edgeIdx }}));

  // 重新把群組標籤附加到邊的上方
  _groupLabelElements.forEach(el => root.appendChild(el));

  // ── 節點（最後渲染：位於邊之上，覆蓋交叉點） ──
  NODES.forEach(node => {{
    const pos = positions[node.id];
    if (!pos) return;
    const isPe = node.type === 'pe';
    const nw = isPe ? PE_W : SVC_W;
    const nh = isPe ? PE_H : SVC_H;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'node');
    g.setAttribute('data-id', node.id);
    g.setAttribute('transform', `translate(${{pos.x}},${{pos.y}})`);

    // 卡片背景：完整可點擊區域
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('class', 'node-bg');
    rect.setAttribute('width', nw); rect.setAttribute('height', nh);
    rect.setAttribute('rx', '8'); rect.setAttribute('fill', 'white');
    rect.setAttribute('stroke', '#c8c6c4'); rect.setAttribute('stroke-width', '1.2');
    rect.setAttribute('filter', 'url(#shadow)');
    g.appendChild(rect);

    // 頂部顏色強調條
    const accent = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    accent.setAttribute('width', nw); accent.setAttribute('height', '3');
    accent.setAttribute('rx', '8'); accent.setAttribute('fill', node.color);
    accent.setAttribute('opacity', '0.7');
    g.appendChild(accent);

    // 圖示：優先使用官方 Azure 圖示（data URI），否則回退到 SVG
    const iconSize = isPe ? 28 : 36;
    const iconX = (nw - iconSize) / 2;
    const iconY = isPe ? 12 : 14;
    if (node.icon_data_uri) {{
      // 官方 Azure 圖示（Base64 圖片）
      const iconImg = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      iconImg.setAttribute('x', iconX); iconImg.setAttribute('y', iconY);
      iconImg.setAttribute('width', iconSize); iconImg.setAttribute('height', iconSize);
      iconImg.setAttributeNS('http://www.w3.org/1999/xlink', 'href', node.icon_data_uri);
      g.appendChild(iconImg);
    }} else {{
      // 後備：內建 SVG 文字圖示
      const iconG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      iconG.setAttribute('x', iconX); iconG.setAttribute('y', iconY);
      iconG.setAttribute('width', iconSize); iconG.setAttribute('height', iconSize);
      iconG.setAttribute('viewBox', '0 0 48 48');
      iconG.innerHTML = node.icon_svg;
      g.appendChild(iconG);
    }}

    // 名稱：圖示下方保留額外間距（圖示底部約 50，名稱基線約 74 → 保留 24px 空間）
    const name = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    name.setAttribute('x', nw/2); name.setAttribute('y', isPe ? 64 : 74);
    name.setAttribute('text-anchor', 'middle');
    name.setAttribute('font-size', isPe ? '10' : '11');
    name.setAttribute('font-weight', '600'); name.setAttribute('fill', '#323130');
    name.setAttribute('font-family', 'Segoe UI, sans-serif');
    const maxC = isPe ? 14 : 20;
    name.textContent = node.name.length > maxC ? node.name.substring(0, maxC-1) + '..' : node.name;
    g.appendChild(name);

    // SKU 標籤
    if (!isPe && node.sku) {{
      const sku = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      sku.setAttribute('x', nw/2); sku.setAttribute('y', 90);
      sku.setAttribute('text-anchor', 'middle');
      sku.setAttribute('font-size', '10'); sku.setAttribute('fill', '#a19f9d');
      sku.setAttribute('font-family', 'Segoe UI, sans-serif');
      sku.textContent = node.sku;
      g.appendChild(sku);
    }}

    if (isPe && node.details.length > 0) {{
      const det = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      det.setAttribute('x', nw/2); det.setAttribute('y', 76);
      det.setAttribute('text-anchor', 'middle');
      det.setAttribute('font-size', '9'); det.setAttribute('fill', '#a19f9d');
      det.setAttribute('font-family', 'Segoe UI, sans-serif');
      det.textContent = node.details[0];
      g.appendChild(det);
    }}

    // 下方顯示服務類型標籤（不是分類，而是實際服務類型名稱）
    if (!isPe) {{
      const TYPE_LABELS = {{
        'ai_foundry': 'AI Foundry', 'openai': 'Azure OpenAI', 'search': 'AI Search', 'ai_search': 'AI Search',
        'storage': 'Storage', 'adls': 'ADLS Gen2', 'keyvault': 'Key Vault', 'kv': 'Key Vault',
        'fabric': 'Fabric', 'databricks': 'Databricks', 'adf': 'Data Factory', 'data_factory': 'Data Factory',
        'sql_server': 'SQL Server', 'sql_database': 'SQL Database', 'cosmos_db': 'Cosmos DB',
        'vm': 'Virtual Machine', 'aks': 'AKS', 'app_service': 'App Service',
        'function_app': 'Function App', 'synapse': 'Synapse', 'vnet': 'VNet',
        'nsg': 'NSG', 'bastion': 'Bastion', 'pe': 'Private Endpoint',
        'log_analytics': 'Log Analytics', 'app_insights': 'App Insights',
        'monitor': 'Monitor', 'acr': 'Container Registry', 'container_registry': 'Container Registry',
        'document_intelligence': 'Doc Intelligence', 'form_recognizer': 'Doc Intelligence',
        'cdn': 'CDN', 'event_hub': 'Event Hub', 'redis': 'Redis Cache',
        'devops': 'Azure DevOps', 'app_gateway': 'App Gateway',
        'iot_hub': 'IoT Hub', 'stream_analytics': 'Stream Analytics',
        'vpn_gateway': 'VPN Gateway', 'front_door': 'Front Door',
        'ai_hub': 'AI Hub', 'firewall': 'Firewall',
      }};
      const typeLabel = TYPE_LABELS[node.type] || node.type;
      const cat = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      cat.setAttribute('x', nw/2); cat.setAttribute('y', nh + 14);
      cat.setAttribute('text-anchor', 'middle');
      cat.setAttribute('font-size', '10'); cat.setAttribute('fill', node.color);
      cat.setAttribute('font-weight', '600');
      cat.setAttribute('font-family', 'Segoe UI, sans-serif');
      cat.textContent = typeLabel;
      g.appendChild(cat);
    }}

    // 卡片上的 Private 標記
    if (node.private && !isPe) {{
      const badge = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const br = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      br.setAttribute('x', nw - 8); br.setAttribute('y', '4');
      br.setAttribute('width', '6'); br.setAttribute('height', '6');
      br.setAttribute('rx', '3'); br.setAttribute('fill', '#5C2D91');
      br.setAttribute('opacity', '0.6');
      badge.appendChild(br);
      g.appendChild(badge);
    }}

    // ── 事件：區分拖曳與點擊 ──
    g.addEventListener('mousedown', e => {{
      if (e.button !== 0) return;
      dragging = node.id;
      _didDrag = false;
      _dragStartX = e.clientX; _dragStartY = e.clientY;
      const svgPt = getSVGPoint(e);
      dragOffX = svgPt.x - pos.x; dragOffY = svgPt.y - pos.y;
      e.stopPropagation(); e.preventDefault();
    }});
    g.addEventListener('mousemove', e => {{
      if (dragging === node.id) {{
        const dx = Math.abs(e.clientX - _dragStartX);
        const dy = Math.abs(e.clientY - _dragStartY);
        if (dx > 3 || dy > 3) _didDrag = true;
      }}
    }});
    g.addEventListener('mouseup', e => {{
      if (!_didDrag && dragging === node.id) {{
        selectNode(node.id);
      }}
    }});
    g.addEventListener('mouseenter', e => {{
      const tt = document.getElementById('tooltip');
      const dets = node.details.map(d => `<div class="tooltip-detail">› ${{d}}</div>`).join('');
      tt.style.display = 'block';
      tt.innerHTML = `<strong>${{node.name}}</strong>${{node.sku ? `<div class="tooltip-detail">SKU: ${{node.sku}}</div>` : ''}}${{dets}}`;
    }});
    g.addEventListener('mousemove', e => {{
      const tt = document.getElementById('tooltip');
      tt.style.left = (e.clientX+12)+'px'; tt.style.top = (e.clientY-8)+'px';
    }});
    g.addEventListener('mouseleave', () => {{ document.getElementById('tooltip').style.display = 'none'; }});

    root.appendChild(g);
  }});

  // ── 邊標籤（在節點之後渲染，始終顯示在最上層） ──
  _edgeLabels.forEach(el => {{
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.classList.add('edge-label');
    g.setAttribute('data-from', el.from);
    g.setAttribute('data-to', el.to);
    const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    r.classList.add('edge-label-bg');
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const bw = el.label.length * 6 + 10;
    r.setAttribute('x', el.x-bw/2); r.setAttribute('y', el.y-7);
    r.setAttribute('width', bw); r.setAttribute('height', 14);
    r.setAttribute('rx', '3'); r.setAttribute('fill', 'white');
    r.setAttribute('stroke', '#d2d0ce'); r.setAttribute('stroke-width', '0.5');
    r.setAttribute('opacity', '0.95');
    t.setAttribute('x', el.x); t.setAttribute('y', el.y+3);
    t.setAttribute('text-anchor', 'middle'); t.setAttribute('font-size', '9');
    t.setAttribute('fill', '#605e5c'); t.setAttribute('font-family', 'Segoe UI, sans-serif');
    t.textContent = el.label;
    g.appendChild(r); g.appendChild(t);
    root.appendChild(g);
  }});

  // DOM 重建後重新套用文字縮放與選取狀態
  if (typeof _textScale !== 'undefined' && _textScale !== 1) applyTextScale();
  if (_selectedNodeId) applySelectionHighlight();

}}

function getSVGPoint(e) {{
  const svg = document.getElementById('canvas');
  const pt = svg.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  return pt.matrixTransform(document.getElementById('diagram-root').getScreenCTM().inverse());
}}

document.getElementById('canvas').addEventListener('mousemove', e => {{
  if (dragging) {{
    const p = getSVGPoint(e);
    positions[dragging].x = p.x - dragOffX;
    positions[dragging].y = p.y - dragOffY;
    renderDiagram();
  }} else if (draggingGroup !== null) {{
    const p = getSVGPoint(e);
    const dx = p.x - dragOffX;
    const dy = p.y - dragOffY;
    dragOffX = p.x; dragOffY = p.y;
    // 移動群組中的所有節點
    groupDragNodes.forEach(nid => {{
      if (positions[nid]) {{
        positions[nid].x += dx;
        positions[nid].y += dy;
      }}
    }});
    // 同時移動群組框本身
    const gb = groupBoxes[draggingGroup];
    if (gb) {{ gb.x += dx; gb.y += dy; }}
    renderDiagram();
  }}
}});
document.addEventListener('mouseup', () => {{ dragging = null; draggingGroup = null; groupDragNodes = []; }});

// ── 平移與縮放 ──
function applyTransform() {{
  document.getElementById('diagram-root').setAttribute('transform',
    `translate(${{viewTransform.x}},${{viewTransform.y}}) scale(${{viewTransform.scale}})`);
  document.getElementById('zoom-level').textContent = Math.round(viewTransform.scale * 100) + '%';
}}
function fitToScreen() {{
  const svg = document.getElementById('canvas');
  const root = document.getElementById('diagram-root');
  root.setAttribute('transform', '');
  const bbox = root.getBBox();
  if (!bbox.width || !bbox.height) return;
  const w = svg.clientWidth, h = svg.clientHeight;
  const s = Math.min((w-60)/bbox.width, (h-60)/bbox.height, 1.5);
  if (s <= 0) return;
  viewTransform.scale = s;
  viewTransform.x = (w - bbox.width*s)/2 - bbox.x*s;
  viewTransform.y = (h - bbox.height*s)/2 - bbox.y*s;
  applyTransform();
}}
function zoomIn() {{ viewTransform.scale *= 1.25; applyTransform(); }}
function zoomOut() {{ viewTransform.scale *= 0.8; applyTransform(); }}

// ── 文字大小控制 ──
let _textScale = 1.4;  // default 40% larger than raw attribute sizes
function applyTextScale() {{
  document.querySelectorAll('#canvas text').forEach(t => {{
    let orig = t.getAttribute('data-orig-fs');
    if (!orig) {{
      orig = t.getAttribute('font-size');
      if (!orig) {{
        const cs = window.getComputedStyle(t).fontSize;
        orig = cs ? parseFloat(cs).toString() : '11';
      }}
      t.setAttribute('data-orig-fs', orig);
    }}
    t.setAttribute('font-size', (parseFloat(orig) * _textScale).toFixed(2));
  }});
}}
function textBigger() {{ _textScale = Math.min(2.5, _textScale * 1.15); applyTextScale(); }}
function textSmaller() {{ _textScale = Math.max(0.5, _textScale / 1.15); applyTextScale(); }}

function downloadPNG() {{
  const svg = document.getElementById('canvas');
  const bbox = svg.getBBox();
  const pad = 40;
  const w = Math.ceil(bbox.width + bbox.x + pad * 2);
  const h = Math.ceil(bbox.height + bbox.y + pad * 2);

  const clone = svg.cloneNode(true);
  clone.setAttribute('width', w);
  clone.setAttribute('height', h);
  clone.setAttribute('viewBox', `${{-pad}} ${{-pad}} ${{w}} ${{h}}`);
  clone.querySelector('#viewport')?.removeAttribute('transform');

  // 內嵌所有計算後的樣式
  const allEls = clone.querySelectorAll('*');
  const origEls = svg.querySelectorAll('*');
  allEls.forEach((el, i) => {{
    if (origEls[i]) {{
      const cs = window.getComputedStyle(origEls[i]);
      ['fill','stroke','stroke-width','font-size','font-family','font-weight',
       'text-anchor','opacity','fill-opacity','stroke-opacity','stroke-dasharray'].forEach(p => {{
        const v = cs.getPropertyValue(p);
        if (v) el.style.setProperty(p, v);
      }});
    }}
  }});

  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(clone);
  const svgBlob = new Blob([svgStr], {{type: 'image/svg+xml;charset=utf-8'}});
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {{
    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);

    canvas.toBlob(blob => {{
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (document.title || 'azure-architecture') + '.png';
      a.click();
      URL.revokeObjectURL(a.href);
    }}, 'image/png');
  }};
  img.src = url;
}}

document.getElementById('canvas').addEventListener('wheel', e => {{
  e.preventDefault();
  const f = e.deltaY < 0 ? 1.1 : 0.9;
  const rect = document.getElementById('canvas').getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  const os = viewTransform.scale, ns = os * f;
  viewTransform.x = mx - (mx - viewTransform.x) * (ns/os);
  viewTransform.y = my - (my - viewTransform.y) * (ns/os);
  viewTransform.scale = ns;
  applyTransform();
}}, {{ passive: false }});

document.getElementById('canvas').addEventListener('mousedown', e => {{
  if (e.target.closest('.node')) return;
  isPanning = true;
  panSX = e.clientX; panSY = e.clientY;
  panSTx = viewTransform.x; panSTy = viewTransform.y;
  document.getElementById('canvas').style.cursor = 'grabbing';
  e.preventDefault();
}});
document.addEventListener('mousemove', e => {{
  if (isPanning) {{
    viewTransform.x = panSTx + (e.clientX - panSX);
    viewTransform.y = panSTy + (e.clientY - panSY);
    applyTransform();
  }}
}});
document.addEventListener('mouseup', () => {{
  if (isPanning) {{ isPanning = false; document.getElementById('canvas').style.cursor = ''; }}
}});

// ── 側邊欄 ──
function buildSidebar() {{
  const list = document.getElementById('service-list');
  const byCat = {{}};
  NODES.forEach(n => {{ if (!byCat[n.category]) byCat[n.category] = []; byCat[n.category].push(n); }});
  Object.entries(byCat).forEach(([cat, nodes]) => {{
    const cd = document.createElement('div');
    cd.className = 'cat-label'; cd.textContent = cat;
    list.appendChild(cd);
    nodes.forEach(node => {{
      const card = document.createElement('div');
      card.className = 'service-card'; card.id = 'card-' + node.id;
      card.innerHTML = `
        <div class="service-card-header">
          <div class="sc-icon">${{node.icon_data_uri ? `<img src="${{node.icon_data_uri}}" width="28" height="28" style="object-fit:contain;">` : `<svg viewBox="0 0 48 48">${{node.icon_svg}}</svg>`}}</div>
          <div>
            <div class="service-name">${{node.name}}</div>
            <div class="service-sku">${{node.sku || node.type}}</div>
          </div>
          ${{node.private ? '<span class="private-badge">私用</span>' : ''}}
        </div>
        ${{node.details.length > 0 ? `<div class="service-card-body">${{node.details.map(d => `<div class="service-detail">${{d}}</div>`).join('')}}</div>` : ''}}
      `;
      card.addEventListener('click', () => {{
        selectNode(node.id);
      }});
      list.appendChild(card);
    }});
  }});
}}

// ── VNet 醒目顯示切換 ──
let _vnetHighlighted = false;
function toggleVNetHighlight() {{
  _vnetHighlighted = !_vnetHighlighted;
  const vr = document.getElementById('vnet-rect');
  if (!vr) return;
  if (_vnetHighlighted) {{
    vr.setAttribute('stroke-width', '4');
    vr.setAttribute('stroke', '#5C2D91');
    vr.setAttribute('fill', '#f0eaf8');
  }} else {{
    vr.setAttribute('stroke-width', '2');
    vr.setAttribute('stroke', '#5C2D91');
    vr.setAttribute('fill', '#f8f7ff');
  }}
  // 同時切換側邊欄卡片
  const card = document.getElementById('card-vnet-boundary');
  if (card) card.classList.toggle('selected', _vnetHighlighted);
}}

renderDiagram();
buildSidebar();

// ── VNet 側邊欄卡片（若存在 VNet 邊界則動態加入） ──
if (VNET_INFO || NODES.some(n => n.private && n.type !== 'pe') || NODES.some(n => n.type === 'pe')) {{
  const list = document.getElementById('service-list');
  // 插入到最上方
  const catLabel = document.createElement('div');
  catLabel.className = 'cat-label'; catLabel.textContent = 'NETWORK';
  const card = document.createElement('div');
  card.className = 'service-card'; card.id = 'card-vnet-boundary';
  const vnetIcon = '<rect x="6" y="6" width="36" height="36" rx="4" fill="none" stroke="#5C2D91" stroke-width="3"/><circle cx="16" cy="18" r="3" fill="#5C2D91"/><circle cx="32" cy="18" r="3" fill="#5C2D91"/><circle cx="24" cy="32" r="3" fill="#5C2D91"/>';
  const vnetDetails = VNET_INFO ? VNET_INFO.split('|').map(s => s.trim()) : [];
  card.innerHTML = `
    <div class="service-card-header">
      <div class="sc-icon"><svg viewBox="0 0 48 48">${{vnetIcon}}</svg></div>
      <div>
        <div class="service-name">虛擬網路</div>
        <div class="service-sku">vnet</div>
      </div>
      <span class="private-badge">私用</span>
    </div>
    ${{vnetDetails.length > 0 ? `<div class="service-card-body">${{vnetDetails.map(d => `<div class="service-detail">${{d}}</div>`).join('')}}</div>` : ''}}
  `;
  card.addEventListener('click', () => {{ toggleVNetHighlight(); }});
  list.insertBefore(card, list.firstChild);
  list.insertBefore(catLabel, list.firstChild);
}}
setTimeout(fitToScreen, 100);
</script>
</body>
</html>"""
    return html

def generate_diagram(services, connections, title="Azure 架構", vnet_info="", hierarchy=None):
    """產生活動式 Azure 架構圖為 HTML 字串。

    參數：
        services: 包含 id, name, type, sku, private, details 等金鑰的字典列表。
        connections: 包含 from, to, label, type 等金鑰的字典列表。
        title: 架構圖標題字串。
        vnet_info: 虛擬網路 CIDR 資訊字串。
        hierarchy: 選用的訂用帳戶/資源群組階層列表。

    傳回：
        包含互動式架構圖的 HTML 字串。
    """
    return generate_html(services, connections, title, vnet_info=vnet_info, hierarchy=hierarchy)
