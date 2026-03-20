import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  addDoc, 
  runTransaction, 
  query, 
  orderBy, 
  limit,
  getDocFromServer,
  Timestamp,
  writeBatch,
  where,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { LaptopClass, Stock, Transaction, TransactionType, Batch } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { 
  Plus, 
  Minus, 
  RefreshCw, 
  History, 
  LayoutDashboard, 
  LogOut, 
  LogIn, 
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ArrowRightLeft,
  Settings,
  Edit2
} from 'lucide-react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const CLASSES: LaptopClass[] = ['A', 'B', 'C', 'C-', 'D'];

const INITIAL_STOCK: Stock = {
  classA: 0,
  classB: 0,
  classC: 0,
  classCMinus: 0,
  classD: 0,
  unclassified: 0,
  lastUpdated: new Date().toISOString()
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [stock, setStock] = useState<Stock | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'add' | 'batches'>('dashboard');

  // Form states
  const [txType, setTxType] = useState<TransactionType>('INCOMING');
  const [batchId, setBatchId] = useState('');
  const [fromClass, setFromClass] = useState<LaptopClass>('D');
  const [toClass, setToClass] = useState<LaptopClass>('A');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Batch Editing States
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [newBatchName, setNewBatchName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
      if (!user) {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Test connection
  useEffect(() => {
    if (!isAuthReady || !user) return;
    
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'inventory', 'current'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          setError("Firestore is offline. Please check your configuration.");
        }
      }
    }
    testConnection();
  }, [isAuthReady, user]);

  useEffect(() => {
    if (!isAuthReady || !user) return;

    const stockRef = doc(db, 'inventory', 'current');
    const txQuery = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'), limit(50));
    const batchesQuery = query(collection(db, 'batches'), orderBy('createdAt', 'desc'));

    const unsubStock = onSnapshot(stockRef, (doc) => {
      if (doc.exists()) {
        setStock(doc.data() as Stock);
      } else {
        setDoc(stockRef, INITIAL_STOCK).catch(err => handleFirestoreError(err, OperationType.WRITE, 'inventory/current'));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'inventory/current'));

    const unsubBatches = onSnapshot(batchesQuery, (snapshot) => {
      const b: Batch[] = [];
      snapshot.forEach((doc) => {
        b.push({ id: doc.id, ...doc.data() } as Batch);
      });
      setBatches(b);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'batches'));

    const unsubTx = onSnapshot(txQuery, (snapshot) => {
      const txs: Transaction[] = [];
      snapshot.forEach((doc) => {
        txs.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setTransactions(txs);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'transactions'));

    return () => {
      unsubStock();
      unsubBatches();
      unsubTx();
    };
  }, [isAuthReady, user]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Login failed:', err);
      setError('Failed to log in with Google.');
    }
  };

  const handleLogout = () => signOut(auth);

  const getStockKey = (className: LaptopClass): keyof Stock => {
    switch (className) {
      case 'A': return 'classA';
      case 'B': return 'classB';
      case 'C': return 'classC';
      case 'C-': return 'classCMinus';
      case 'D': return 'classD';
      case 'UNCLASSIFIED': return 'unclassified';
    }
  };

  const handleBatchIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\//g, '-');
    
    // If user is deleting, just let them delete
    if (val.length < batchId.length) {
      setBatchId(val);
      return;
    }

    // Auto-format
    const digits = val.replace(/\D/g, '');
    let formatted = '';
    if (digits.length > 0) formatted += digits.substring(0, 2);
    if (digits.length >= 3) formatted += '-' + digits.substring(2, 4);
    if (digits.length >= 5) formatted += '-' + digits.substring(4, 8);
    
    if (val.endsWith('-') && formatted.length > 0 && !formatted.endsWith('-')) {
      formatted += '-';
    }

    setBatchId(formatted);
  };

  const handleRenameBatch = async () => {
    if (!editingBatch || !newBatchName.trim() || !user) return;
    const oldBatchId = editingBatch.batchId;
    const newId = newBatchName.trim();
    
    if (oldBatchId === newId) {
      setEditingBatch(null);
      return;
    }

    setIsRenaming(true);
    setError(null);

    try {
      const batch = writeBatch(db);
      
      // 1. Get old batch data
      const oldBatchRef = doc(db, 'batches', oldBatchId);
      const oldBatchSnap = await getDoc(oldBatchRef);
      if (!oldBatchSnap.exists()) throw new Error("Batch not found");
      
      // 2. Check if new batch exists
      const newBatchRef = doc(db, 'batches', newId);
      const newBatchSnap = await getDoc(newBatchRef);
      if (newBatchSnap.exists()) throw new Error("A batch with this name already exists");
      
      // 3. Create new batch
      const batchData = oldBatchSnap.data();
      batchData.batchId = newId;
      batch.set(newBatchRef, batchData);
      
      // 4. Delete old batch
      batch.delete(oldBatchRef);
      
      // 5. Update transactions
      const txQuery = query(collection(db, 'transactions'), where('batchId', '==', oldBatchId));
      const txSnaps = await getDocs(txQuery);
      txSnaps.forEach((txDoc) => {
        batch.update(txDoc.ref, { batchId: newId });
      });
      
      await batch.commit();
      setEditingBatch(null);
      if (selectedBatchId === oldBatchId) {
        setSelectedBatchId(newId);
      }
    } catch (err: any) {
      console.error('Rename failed:', err);
      setError(err.message || 'Failed to rename batch.');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !stock) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await runTransaction(db, async (transaction) => {
        const stockRef = doc(db, 'inventory', 'current');
        const batchRef = doc(db, 'batches', batchId);
        
        const stockDoc = await transaction.get(stockRef);
        const batchDoc = await transaction.get(batchRef);
        
        if (!stockDoc.exists()) {
          throw new Error("Global stock document does not exist!");
        }

        const currentStock = stockDoc.data() as Stock;
        const newStock: Stock = { 
          classA: currentStock.classA || 0,
          classB: currentStock.classB || 0,
          classC: currentStock.classC || 0,
          classCMinus: currentStock.classCMinus || 0,
          classD: currentStock.classD || 0,
          unclassified: currentStock.unclassified || 0,
          lastUpdated: new Date().toISOString() 
        };

        let currentBatchStock: Batch;
        if (batchDoc.exists()) {
          const data = batchDoc.data() as Batch;
          currentBatchStock = {
            ...data,
            classA: data.classA || 0,
            classB: data.classB || 0,
            classC: data.classC || 0,
            classCMinus: data.classCMinus || 0,
            classD: data.classD || 0,
            unclassified: data.unclassified || 0,
          };
        } else {
          // Create new batch if it doesn't exist
          currentBatchStock = {
            batchId,
            classA: 0,
            classB: 0,
            classC: 0,
            classCMinus: 0,
            classD: 0,
            unclassified: 0,
            createdAt: new Date().toISOString()
          };
        }
        const newBatchStock = { ...currentBatchStock };

        // Calculate new stock levels
        if (txType === 'INCOMING') {
          const key = 'unclassified';
          (newStock[key] as number) += quantity;
          (newBatchStock[key] as number) += quantity;
        } else if (txType === 'SALE') {
          const key = getStockKey(fromClass);
          if ((currentBatchStock[key] as number) < quantity) {
            throw new Error(`Insufficient stock in Batch ${batchId}, Class ${fromClass}`);
          }
          (newStock[key] as number) -= quantity;
          (newBatchStock[key] as number) -= quantity;
        } else if (txType === 'REPAIR') {
          const fromKey = getStockKey(fromClass);
          const toKey = getStockKey(toClass);
          if ((currentBatchStock[fromKey] as number) < quantity) {
            throw new Error(`Insufficient stock in Batch ${batchId}, Class ${fromClass}`);
          }
          (newStock[fromKey] as number) -= quantity;
          (newStock[toKey] as number) += quantity;
          (newBatchStock[fromKey] as number) -= quantity;
          (newBatchStock[toKey] as number) += quantity;
        } else if (txType === 'ADJUSTMENT') {
          const key = getStockKey(toClass);
          const diff = quantity - (currentBatchStock[key] as number);
          (newStock[key] as number) += diff;
          (newBatchStock[key] as number) = quantity;
        }

        // Create transaction record
        const txData: any = {
          type: txType,
          batchId,
          quantity,
          timestamp: new Date().toISOString(),
          userId: user.uid,
        };
        
        if (txType === 'REPAIR' || txType === 'SALE') {
          txData.fromClass = fromClass;
        }
        if (txType === 'INCOMING') {
          txData.toClass = 'UNCLASSIFIED';
        } else if (txType === 'REPAIR' || txType === 'ADJUSTMENT') {
          txData.toClass = toClass;
        }
        if (notes.trim()) {
          txData.notes = notes.trim();
        }

        transaction.update(stockRef, newStock as any);
        transaction.set(batchRef, newBatchStock);
        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, txData);
      });

      // Reset form
      setQuantity(1);
      setNotes('');
      setBatchId('');
      setActiveTab('dashboard');
    } catch (err: any) {
      console.error('Transaction failed:', err);
      setError(err.message || 'Failed to process transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthReady || loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-indigo-900/60 font-medium animate-pulse">Initializing Ledger...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-indigo-100/50 p-10 text-center border border-indigo-50">
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 rotate-3 shadow-lg shadow-indigo-200">
            <LayoutDashboard className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Repair Ledger Pro</h1>
          <p className="text-gray-500 mb-10 leading-relaxed">
            Securely track your second-hand laptop inventory and repair transitions with automated consistency checks.
          </p>
          <button
            onClick={handleLogin}
            className="w-full bg-indigo-600 text-white font-semibold py-4 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 group active:scale-95 shadow-lg shadow-indigo-100"
          >
            <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            Sign in with Google
          </button>
          <p className="mt-8 text-xs text-gray-400 uppercase tracking-widest font-medium">
            Authorized Personnel Only
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans selection:bg-indigo-100">
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-md bg-white/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-100">
                  <LayoutDashboard className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-gray-900 hidden sm:block">Repair Ledger Pro</span>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                    {user.displayName?.charAt(0) || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-600">{user.displayName}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-8 bg-red-50 border border-red-100 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
          )}

          {/* Mobile Tabs */}
          <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 mb-8 shadow-sm overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                activeTab === 'dashboard' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('batches')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                activeTab === 'batches' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <Settings className="w-4 h-4" />
              Batches
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                activeTab === 'add' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <Plus className="w-4 h-4" />
              New Entry
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                activeTab === 'history' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <History className="w-4 h-4" />
              Ledger
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Dashboard & Stats */}
            <div className={cn(
              "lg:col-span-8 space-y-8",
              activeTab !== 'dashboard' && "hidden lg:block"
            )}>
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Current Inventory</h2>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Last updated: {stock ? format(new Date(stock.lastUpdated), 'HH:mm:ss') : 'Never'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                  <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 group-hover:text-indigo-600 transition-colors">Unclassified</div>
                    <div className="text-4xl font-black text-indigo-900 tabular-nums">
                      {stock ? stock.unclassified : 0}
                    </div>
                  </div>
                  {CLASSES.map((cls) => (
                    <div key={cls} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 group-hover:text-indigo-600 transition-colors">Class {cls}</div>
                      <div className="text-4xl font-black text-gray-900 tabular-nums">
                        {stock ? stock[getStockKey(cls)] : 0}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                  <button onClick={() => setActiveTab('history')} className="text-indigo-600 text-sm font-bold hover:underline flex items-center gap-1">
                    View Full Ledger <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="px-8 py-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          tx.type === 'INCOMING' && "bg-emerald-50 text-emerald-600",
                          tx.type === 'SALE' && "bg-orange-50 text-orange-600",
                          tx.type === 'REPAIR' && "bg-indigo-50 text-indigo-600",
                          tx.type === 'ADJUSTMENT' && "bg-gray-50 text-gray-600"
                        )}>
                          {tx.type === 'INCOMING' && <Plus className="w-5 h-5" />}
                          {tx.type === 'SALE' && <Minus className="w-5 h-5" />}
                          {tx.type === 'REPAIR' && <RefreshCw className="w-5 h-5" />}
                          {tx.type === 'ADJUSTMENT' && <Settings className="w-5 h-5" />}
                        </div>
                        <div>
                    <p className="font-bold text-gray-900">
                      {tx.type === 'REPAIR' ? (
                        <>Repair: {tx.fromClass} <ArrowRightLeft className="inline w-3 h-3 mx-1 text-gray-400" /> {tx.toClass}</>
                      ) : tx.type === 'INCOMING' ? (
                        <>Incoming Batch</>
                      ) : (
                        <>{tx.type.charAt(0) + tx.type.slice(1).toLowerCase()} {tx.toClass || tx.fromClass}</>
                      )}
                    </p>
                          <p className="text-xs text-gray-400 font-medium">{format(new Date(tx.timestamp), 'MMM d, HH:mm')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "text-lg font-bold tabular-nums",
                          (tx.type === 'INCOMING' || tx.type === 'REPAIR') ? "text-emerald-600" : "text-orange-600"
                        )}>
                          {tx.type === 'INCOMING' || tx.type === 'REPAIR' ? '+' : '-'}{tx.quantity}
                        </p>
                        {tx.notes && <p className="text-[10px] text-gray-400 max-w-[120px] truncate">{tx.notes}</p>}
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="px-8 py-12 text-center text-gray-400">
                      No transactions recorded yet.
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Right Column: Add Transaction Form */}
            <div className={cn(
              "lg:col-span-4",
              activeTab !== 'add' && "hidden lg:block"
            )}>
              <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-indigo-100/20 p-8 sticky top-28">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 tracking-tight">Record Transaction</h2>
                
                <form onSubmit={handleAddTransaction} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Batch ID (Date)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g., 16-03-2026"
                        value={batchId}
                        onChange={handleBatchIdChange}
                        className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                        required
                      />
                      <select
                        onChange={(e) => setBatchId(e.target.value)}
                        className="bg-gray-50 border-none rounded-xl px-2 py-3 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="">Select Existing</option>
                        {batches.map(b => <option key={b.id} value={b.batchId}>{b.batchId}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Transaction Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['INCOMING', 'REPAIR', 'SALE', 'ADJUSTMENT'] as TransactionType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setTxType(type)}
                          className={cn(
                            "py-3 px-2 rounded-xl text-xs font-bold transition-all border",
                            txType === type 
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100" 
                              : "bg-white text-gray-500 border-gray-100 hover:border-indigo-200"
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {(txType === 'REPAIR' || txType === 'SALE') && (
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">From Class</label>
                        <select
                          value={fromClass}
                          onChange={(e) => setFromClass(e.target.value as LaptopClass)}
                          className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="UNCLASSIFIED">Unclassified</option>
                          {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                        </select>
                      </div>
                    )}
                    {(txType === 'REPAIR' || txType === 'ADJUSTMENT') && (
                      <div className={cn(txType === 'ADJUSTMENT' && "col-span-2")}>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                          {txType === 'ADJUSTMENT' ? 'Target Class' : 'To Class'}
                        </label>
                        <select
                          value={toClass}
                          onChange={(e) => setToClass(e.target.value as LaptopClass)}
                          className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                      {txType === 'ADJUSTMENT' ? 'New Total Count' : 'Quantity'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Notes (Optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g., Customer return, Repair batch #42..."
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    {isSubmitting ? 'Processing...' : 'Record Entry'}
                  </button>
                </form>
              </div>
            </div>

            {/* Batches Tab */}
            <div className={cn(
              "lg:col-span-12 space-y-8",
              activeTab !== 'batches' && "hidden"
            )}>
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Batch Stock Levels</h2>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                  >
                    <option value="">Select a Batch to View</option>
                    {batches.map(b => <option key={b.id} value={b.batchId}>{b.batchId}</option>)}
                  </select>
                </div>

                {selectedBatchId ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                    {(() => {
                      const b = batches.find(x => x.batchId === selectedBatchId);
                      return (
                        <>
                          <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 group-hover:text-indigo-600 transition-colors">Unclassified</div>
                            <div className="text-4xl font-black text-indigo-900 tabular-nums">
                              {b ? b.unclassified : 0}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-2">In Batch {selectedBatchId}</div>
                          </div>
                          {CLASSES.map((cls) => (
                            <div key={cls} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 group-hover:text-indigo-600 transition-colors">Class {cls}</div>
                              <div className="text-4xl font-black text-gray-900 tabular-nums">
                                {b ? (b as any)[getStockKey(cls)] : 0}
                              </div>
                              <div className="text-[10px] text-gray-400 mt-2">In Batch {selectedBatchId}</div>
                            </div>
                          ))}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center">
                    <Settings className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">Select a batch from the dropdown to see its specific stock levels.</p>
                  </div>
                )}
              </section>

              <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30">
                  <h2 className="text-xl font-bold text-gray-900">All Batches Summary</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Batch ID</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Created</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Unclassified</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">A</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">B</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">C</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">C-</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">D</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {batches.map((b) => (
                        <tr key={b.id} className="hover:bg-gray-50/30 transition-colors cursor-pointer" onClick={() => setSelectedBatchId(b.batchId)}>
                          <td className="px-8 py-4">
                            <p className="text-sm font-bold text-indigo-600">{b.batchId}</p>
                          </td>
                          <td className="px-8 py-4">
                            <p className="text-xs text-gray-500">{format(new Date(b.createdAt), 'MMM d, yyyy')}</p>
                          </td>
                          <td className="px-8 py-4 text-center font-bold text-indigo-600">{b.unclassified}</td>
                          <td className="px-8 py-4 text-center font-bold text-gray-900">{b.classA}</td>
                          <td className="px-8 py-4 text-center font-bold text-gray-900">{b.classB}</td>
                          <td className="px-8 py-4 text-center font-bold text-gray-900">{b.classC}</td>
                          <td className="px-8 py-4 text-center font-bold text-gray-900">{b.classCMinus}</td>
                          <td className="px-8 py-4 text-center font-bold text-gray-900">{b.classD}</td>
                          <td className="px-8 py-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingBatch(b);
                                setNewBatchName(b.batchId);
                              }}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Batch Name"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
            <div className={cn(
              "lg:col-span-12",
              activeTab !== 'history' && "hidden"
            )}>
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                  <h2 className="text-xl font-bold text-gray-900">Full Transaction Ledger</h2>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Showing last 50 entries
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date & Time</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Batch</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Type</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Movement</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Qty</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50/30 transition-colors">
                          <td className="px-8 py-4 whitespace-nowrap">
                            <p className="text-sm font-bold text-gray-900">{format(new Date(tx.timestamp), 'MMM d, yyyy')}</p>
                            <p className="text-[10px] text-gray-400 font-medium">{format(new Date(tx.timestamp), 'HH:mm:ss')}</p>
                          </td>
                          <td className="px-8 py-4">
                            <p className="text-sm font-bold text-indigo-600">{tx.batchId}</p>
                          </td>
                          <td className="px-8 py-4">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                              tx.type === 'INCOMING' && "bg-emerald-100 text-emerald-700",
                              tx.type === 'SALE' && "bg-orange-100 text-orange-700",
                              tx.type === 'REPAIR' && "bg-indigo-100 text-indigo-700",
                              tx.type === 'ADJUSTMENT' && "bg-gray-100 text-gray-700"
                            )}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="px-8 py-4">
                            <p className="text-sm font-semibold text-gray-700">
                              {tx.type === 'REPAIR' ? (
                                <>{tx.fromClass} <ArrowRightLeft className="inline w-3 h-3 mx-1 text-gray-400" /> {tx.toClass}</>
                              ) : tx.type === 'INCOMING' ? (
                                <>To Unclassified</>
                              ) : tx.type === 'SALE' ? (
                                <>From {tx.fromClass}</>
                              ) : (
                                <>Class {tx.toClass}</>
                              )}
                            </p>
                          </td>
                          <td className="px-8 py-4 text-right">
                            <p className={cn(
                              "text-sm font-bold tabular-nums",
                              (tx.type === 'INCOMING' || tx.type === 'REPAIR') ? "text-emerald-600" : "text-orange-600"
                            )}>
                              {tx.type === 'INCOMING' || tx.type === 'REPAIR' ? '+' : '-'}{tx.quantity}
                            </p>
                          </td>
                          <td className="px-8 py-4">
                            <p className="text-xs text-gray-500 italic max-w-xs truncate">{tx.notes || '-'}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-100 mt-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-gray-400">
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Repair Ledger Pro v1.0</span>
            </div>
            <div className="flex items-center gap-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
              <span>Secure Transaction Ledger</span>
              <span>•</span>
              <span>Automated Consistency</span>
              <span>•</span>
              <span>Cloud Sync</span>
            </div>
          </div>
        </footer>
      {/* Edit Batch Modal */}
      {editingBatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 bg-red-50/30">
              <div className="flex items-center gap-3 text-red-600 mb-2">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-xl font-bold">Rename Batch</h3>
              </div>
              <p className="text-sm text-red-600/80 font-medium">
                Warning: This is a fatal operation. Renaming a batch will update the batch record and all associated transactions.
              </p>
            </div>
            <div className="p-8">
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">New Batch Name</label>
                <input
                  type="text"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g., 16-03-2026"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setEditingBatch(null)}
                  disabled={isRenaming}
                  className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenameBatch}
                  disabled={isRenaming || !newBatchName.trim() || newBatchName.trim() === editingBatch.batchId}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isRenaming ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Renaming...
                    </>
                  ) : (
                    'Confirm Rename'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
}
