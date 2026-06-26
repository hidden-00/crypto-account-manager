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
exports.default = App;
const react_1 = __importStar(require("react"));
const expo_status_bar_1 = require("expo-status-bar");
const react_native_1 = require("react-native");
const native_1 = require("@react-navigation/native");
const native_stack_1 = require("@react-navigation/native-stack");
const axios_1 = __importDefault(require("axios"));
const LoginScreen_1 = __importDefault(require("./src/screens/LoginScreen"));
const DashboardScreen_1 = __importDefault(require("./src/screens/DashboardScreen"));
const AccountDetailScreen_1 = __importDefault(require("./src/screens/AccountDetailScreen"));
const Stack = (0, native_stack_1.createNativeStackNavigator)();
const API_BASE_URL = 'http://10.0.2.2:3000';
axios_1.default.defaults.baseURL = API_BASE_URL;
function App() {
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [authReady, setAuthReady] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const checkAuth = async () => {
            try {
                const sessionId = 'demo-session';
                const res = await axios_1.default.get('/api/auth/me', {
                    headers: { 'X-Session-Id': sessionId },
                });
                if (res.data?.user) {
                    setAuthReady(true);
                }
            }
            catch {
                setAuthReady(false);
            }
            finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);
    if (loading) {
        return (<react_native_1.View style={styles.container}>
        <react_native_1.ActivityIndicator size="large" color="#4f46e5"/>
        <react_native_1.Text style={styles.loadingText}>Đang kết nối...</react_native_1.Text>
      </react_native_1.View>);
    }
    return (<>
      <expo_status_bar_1.StatusBar style="light"/>
      <native_1.NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!authReady ? (<Stack.Screen name="Login" component={LoginScreen_1.default}/>) : (<>
              <Stack.Screen name="Dashboard" component={DashboardScreen_1.default}/>
              <Stack.Screen name="AccountDetail" component={AccountDetailScreen_1.default}/>
            </>)}
        </Stack.Navigator>
      </native_1.NavigationContainer>
    </>);
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f172a',
    },
    loadingText: {
        color: 'white',
        marginTop: 12,
        fontSize: 16,
    },
});
