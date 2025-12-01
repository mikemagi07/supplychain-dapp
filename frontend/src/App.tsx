import React, { useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { ChakraProvider, Box, Button, Text, Heading, Input, FormControl, FormLabel, useToast, Card, Table, Tbody, Tr, Td, VStack } from '@chakra-ui/react';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './config';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// Icons removed due to type conflicts - using emoji instead
import QRCode from 'qrcode.react';
import { extendTheme } from '@chakra-ui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

declare global {
  interface Window {
    ethereum?: any;
  }
}

enum Role {
  None = 'None',
  Producer = 'Producer',
  Supplier = 'Supplier',
  Retailer = 'Retailer',
  Consumer = 'Consumer',
}

enum ProductStatus {
  Created = 0,
  SentToSupplier = 1,
  ReceivedBySupplier = 2,
  SentToRetailer = 3,
  ReceivedByRetailer = 4,
  AvailableForSale = 5,
  SoldToConsumer = 6,
}

interface Product {
  id: number;
  name: string;
  description: string;
  quantity: number;
  createdAt: number;
  producer: string;
  supplier: string;
  retailer: string;
  consumer: string;
  status: ProductStatus;
  shippingInfo: string;
}

const theme = extendTheme({
  config: { initialColorMode: 'dark', useSystemColorMode: false },
  colors: { brand: { 500: '#00bfff', 600: '#1a202c' } },
  components: { Button: { baseStyle: { _hover: { transform: 'scale(1.05)', bg: 'brand.500' } } }, Card: { baseStyle: { bg: 'gray.700', color: 'white', shadow: 'lg', borderRadius: 'lg' } } },
});

const App: React.FC = () => {
  const toast = useToast();
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [role, setRole] = useState<Role>(Role.None);

  useEffect(() => {
    connectWallet();
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);

        const supplyChainContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(supplyChainContract);

        await detectRole(supplyChainContract, address);

        toast({ title: 'Wallet connected!', status: 'success' });
      } catch (error) {
        toast({ title: 'Failed to connect wallet', status: 'error' });
      }
    } else {
      toast({ title: 'MetaMask not detected', status: 'error' });
    }
  };

  const detectRole = async (contract: Contract, address: string) => {
    const isProducer = await contract.producers(address);
    if (isProducer) return setRole(Role.Producer);

    const isSupplier = await contract.suppliers(address);
    if (isSupplier) return setRole(Role.Supplier);

    const isRetailer = await contract.retailers(address);
    if (isRetailer) return setRole(Role.Retailer);

    setRole(Role.Consumer);
  };

  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Box p={4} bgGradient="linear(to-r, brand.600, gray.800)" minH="100vh" color="white">
          <Heading mb={6} textAlign="center" fontFamily="mono">Blockchain Supply Chain DApp</Heading>
          {!account ? (
            <Button colorScheme="blue" size="lg" w="full" onClick={connectWallet}>Connect Wallet</Button>
          ) : (
            <Text mb={4} textAlign="center">Connected: {account.slice(0,6)}...{account.slice(-4)} | Role: {role}</Text>
          )}
          <Routes>
            <Route path="/" element={<Dashboard contract={contract} role={role} account={account} toast={toast} />} />
          </Routes>
        </Box>
      </Router>
    </ChakraProvider>
  );
};

const Dashboard: React.FC<{ contract: Contract | null; role: Role; account: string | null; toast: any }> = ({ contract, role, account, toast }) => {
  const [productId, setProductId] = useState<string>('');
  const [product, setProduct] = useState<Product | null>(null);

  const fetchProduct = async (id: number) => {
    if (contract) {
      try {
        const prod = await contract.getProduct(id);
        setProduct({
          id: Number(prod[0]),
          name: prod[1],
          description: prod[2],
          quantity: Number(prod[3]),
          createdAt: Number(prod[4]),
          producer: prod[5],
          supplier: prod[6],
          retailer: prod[7],
          consumer: prod[8],
          status: Number(prod[9]),
          shippingInfo: prod[10],
        });
      } catch (error) {
        toast({ title: 'Error fetching product', status: 'error' });
      }
    }
  };

  if (!contract || !account) return <Text>Loading...</Text>;

  return (
    <Card p={6}>
      <Heading size="lg" mb={4} display="flex" alignItems="center">
        <Text mr={2} fontSize="1.5em">
          {role === Role.Producer && '🚜'}
          {role === Role.Supplier && '🚚'}
          {role === Role.Retailer && '🏪'}
          {(role === Role.Consumer || role === Role.None) && '👤'}
        </Text>
        {role} Dashboard
      </Heading>
      {role === Role.Producer && <ProducerDashboard contract={contract} toast={toast} />}
      {role === Role.Supplier && <SupplierDashboard contract={contract} toast={toast} productId={productId} setProductId={setProductId} fetchProduct={fetchProduct} />}
      {role === Role.Retailer && <RetailerDashboard contract={contract} toast={toast} productId={productId} setProductId={setProductId} fetchProduct={fetchProduct} />}
      {role === Role.Consumer && <ConsumerDashboard toast={toast} productId={productId} setProductId={setProductId} fetchProduct={fetchProduct} product={product} />}
    </Card>
  );
};

const ProducerDashboard = ({ contract, toast }: { contract: Contract; toast: any }) => {
  const formik = useFormik({
    initialValues: { name: '', description: '', quantity: 0, supplier: '' },
    validationSchema: Yup.object({
      name: Yup.string().required(),
      description: Yup.string().required(),
      quantity: Yup.number().min(1).required(),
      supplier: Yup.string().required(),
    }),
    onSubmit: async (values) => {
      try {
        const tx = await contract.addProduct(values.name, values.description, values.quantity);
        await tx.wait();
        toast({ title: 'Product added!', status: 'success' });

        const productId = Number(await contract.productCount());
        const tx2 = await contract.sendToSupplier(productId, values.supplier);
        await tx2.wait();
        toast({ title: 'Product sent to supplier!', status: 'success' });
      } catch (error) {
        toast({ title: 'Error', status: 'error' });
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <FormControl mb={4}>
        <FormLabel>Name</FormLabel>
        <Input name="name" onChange={formik.handleChange} value={formik.values.name} />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Description</FormLabel>
        <Input name="description" onChange={formik.handleChange} value={formik.values.description} />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Quantity</FormLabel>
        <Input name="quantity" type="number" onChange={formik.handleChange} value={formik.values.quantity} />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Supplier Address</FormLabel>
        <Input name="supplier" onChange={formik.handleChange} value={formik.values.supplier} />
      </FormControl>
      <Button type="submit" colorScheme="blue" w="full">Add and Send Product</Button>
    </form>
  );
};

const SupplierDashboard = ({ contract, toast, productId, setProductId, fetchProduct }: { contract: Contract; toast: any; productId: string; setProductId: (id: string) => void; fetchProduct: (id: number) => void }) => {
  const [shippingInfo, setShippingInfo] = useState<string>('');
  const [retailer, setRetailer] = useState<string>('');

  const receive = async () => {
    try {
      const tx = await contract.receiveProduct(Number(productId));
      await tx.wait();
      toast({ title: 'Product received!', status: 'success' });
      fetchProduct(Number(productId));
    } catch (error) {
      toast({ title: 'Error', status: 'error' });
    }
  };

  const updateShipping = async () => {
    try {
      const tx = await contract.updateShippingInfo(Number(productId), shippingInfo);
      await tx.wait();
      toast({ title: 'Shipping updated!', status: 'success' });
      fetchProduct(Number(productId));
    } catch (error) {
      toast({ title: 'Error', status: 'error' });
    }
  };

  const sendToRetailer = async () => {
    try {
      const tx = await contract.sendToRetailer(Number(productId), retailer);
      await tx.wait();
      toast({ title: 'Sent to retailer!', status: 'success' });
      fetchProduct(Number(productId));
    } catch (error) {
      toast({ title: 'Error', status: 'error' });
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      <Input type="number" placeholder="Product ID" value={productId} onChange={(e) => setProductId(e.target.value)} />
      <Button onClick={receive}>Receive Product</Button>
      <Input placeholder="Shipping Info" value={shippingInfo} onChange={(e) => setShippingInfo(e.target.value)} />
      <Button onClick={updateShipping}>Update Shipping</Button>
      <Input placeholder="Retailer Address" value={retailer} onChange={(e) => setRetailer(e.target.value)} />
      <Button onClick={sendToRetailer}>Send to Retailer</Button>
    </VStack>
  );
};

const RetailerDashboard = ({ contract, toast, productId, setProductId, fetchProduct }: { contract: Contract; toast: any; productId: string; setProductId: (id: string) => void; fetchProduct: (id: number) => void }) => {
  const [consumer, setConsumer] = useState<string>('');

  const receive = async () => {
    try {
      const tx = await contract.receiveProductFromSupplier(Number(productId));
      await tx.wait();
      toast({ title: 'Product received!', status: 'success' });
      fetchProduct(Number(productId));
    } catch (error) {
      toast({ title: 'Error', status: 'error' });
    }
  };

  const addToStore = async () => {
    try {
      const tx = await contract.addToStore(Number(productId));
      await tx.wait();
      toast({ title: 'Added to store!', status: 'success' });
      fetchProduct(Number(productId));
    } catch (error) {
      toast({ title: 'Error', status: 'error' });
    }
  };

  const sell = async () => {
    try {
      const tx = await contract.sellToConsumer(Number(productId), consumer);
      await tx.wait();
      toast({ title: 'Sold to consumer!', status: 'success' });
      fetchProduct(Number(productId));
    } catch (error) {
      toast({ title: 'Error', status: 'error' });
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      <Input type="number" placeholder="Product ID" value={productId} onChange={(e) => setProductId(e.target.value)} />
      <Button onClick={receive}>Receive Product</Button>
      <Button onClick={addToStore}>Add to Store</Button>
      <Input placeholder="Consumer Address" value={consumer} onChange={(e) => setConsumer(e.target.value)} />
      <Button onClick={sell}>Sell to Consumer</Button>
    </VStack>
  );
};

const ConsumerDashboard = ({ toast, productId, setProductId, fetchProduct, product }: { toast: any; productId: string; setProductId: (id: string) => void; fetchProduct: (id: number) => void; product: Product | null }) => {
  return (
    <VStack spacing={4} align="stretch">
      <Input placeholder="Product ID" value={productId} onChange={(e) => setProductId(e.target.value)} />
      <Button onClick={() => fetchProduct(Number(productId))}>View Product</Button>
      {product && (
        <Card p={4} mt={4}>
          <Heading size="sm">Product ID: {product.id}</Heading>
          <Table variant="simple">
            <Tbody>
              <Tr><Td>Name</Td><Td>{product.name}</Td></Tr>
              <Tr><Td>Description</Td><Td>{product.description}</Td></Tr>
              <Tr><Td>Quantity</Td><Td>{product.quantity}</Td></Tr>
              <Tr><Td>Status</Td><Td>{ProductStatus[product.status]}</Td></Tr>
              {/* Add more fields as needed */}
            </Tbody>
          </Table>
          <Box mt={4}>
            <QRCode value={`Product ID: ${product.id}`} />
          </Box>
        </Card>
      )}
    </VStack>
  );
};

export default App;