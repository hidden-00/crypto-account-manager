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
exports.default = DashboardScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const axios_1 = __importDefault(require("axios"));
function DashboardScreen({ navigation }) {
    const [accounts, setAccounts] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    const fetchAccounts = async () => {
        try {
            const response = await axios_1.default.get('/api/accounts');
            setAccounts(response.data || []);
        }
        catch (error) {
            react_native_1.Alert.alert('Lỗi', error?.response?.data?.error || 'Không thể tải dữ liệu');
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchAccounts();
    }, []);
    const handleCreateAccount = async () => {
        react_native_1.Alert.prompt('Tạo tài khoản', 'Nhập tên tài khoản', async (name) => {
            if (!name)
                return;
            try {
                const response = await axios_1.default.post('/api/accounts', { name });
                if (response.data?.success) {
                    fetchAccounts();
                }
            }
            catch (error) {
                react_native_1.Alert.alert('Lỗi', error?.response?.data?.error || 'Không thể tạo tài khoản');
            }
        });
    };
    const renderAccount = ({ item }) => (<react_native_1.TouchableOpacity style={styles.accountCard} onPress={() => navigation.navigate('AccountDetail', { accountId: item._id })}>
      <react_native_1.Text style={styles.accountName}>{item.name}</react_native_1.Text>
      <react_native_1.Text style={styles.accountDate}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</react_native_1.Text>
    </react_native_1.TouchableOpacity>);
    return (<react_native_1.View style={styles.container}>
      <react_native_1.View style={styles.header}>
        <react_native_1.View>
          <react_native_1.Text style={styles.greeting}>Xin chào</react_native_1.Text>
          <react_native_1.Text style={styles.title}>Dashboard</react_native_1.Text>
        </react_native_1.View>
        <react_native_1.TouchableOpacity style={styles.addButton} onPress={handleCreateAccount}>
          <react_native_1.Text style={styles.addButtonText}>+ Thêm</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>

      {loading ? (<react_native_1.ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }}/>) : (<react_native_1.FlatList data={accounts} keyExtractor={(item) => item._id} contentContainerStyle={styles.list} refreshControl={<react_native_1.RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAccounts(); }}/>} ListEmptyComponent={<react_native_1.Text style={styles.empty}>Chưa có tài khoản nào</react_native_1.Text>} renderItem={renderAccount}/>)}
    </react_native_1.View>);
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        paddingTop: 48,
        paddingHorizontal: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    greeting: {
        color: '#6b7280',
        fontSize: 14,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
    },
    addButton: {
        backgroundColor: '#4f46e5',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
    },
    addButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    list: {
        paddingBottom: 24,
    },
    accountCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    accountName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111827',
    },
    accountDate: {
        marginTop: 6,
        color: '#6b7280',
    },
    empty: {
        textAlign: 'center',
        color: '#6b7280',
        marginTop: 32,
    },
});
