"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AccountDetailScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const axios_1 = __importDefault(require("axios"));
function AccountDetailScreen({ route }) {
    const { accountId } = route.params;
    const [account, setAccount] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const fetchAccount = async () => {
            try {
                const response = await axios_1.default.get(`/api/accounts/${accountId}`);
                setAccount(response.data);
            }
            catch (error) {
                react_native_1.Alert.alert('Lỗi', error?.response?.data?.error || 'Không thể tải chi tiết');
            }
            finally {
                setLoading(false);
            }
        };
        fetchAccount();
    }, [accountId]);
    if (loading) {
        return (<react_native_1.View style={styles.centered}>
        <react_native_1.ActivityIndicator size="large" color="#4f46e5"/>
      </react_native_1.View>);
    }
    return (<react_native_1.ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <react_native_1.Text style={styles.title}>{account?.name || 'Chi tiết tài khoản'}</react_native_1.Text>
      <react_native_1.Text style={styles.label}>Ngày tạo</react_native_1.Text>
      <react_native_1.Text style={styles.value}>{account ? new Date(account.createdAt).toLocaleString('vi-VN') : '--'}</react_native_1.Text>
      <react_native_1.Text style={styles.label}>ID</react_native_1.Text>
      <react_native_1.Text style={styles.value}>{account?.id || '--'}</react_native_1.Text>
    </react_native_1.ScrollView>);
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    content: {
        padding: 20,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 20,
        color: '#111827',
    },
    label: {
        color: '#6b7280',
        marginTop: 12,
    },
    value: {
        fontSize: 16,
        color: '#111827',
        marginTop: 4,
    },
});
