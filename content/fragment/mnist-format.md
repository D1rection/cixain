---
title: MNIST 手写数据集格式
date: 2026-09-29
updated: 2026-09-29
tags: []
---
数据特点：

- 数据用一种非常简单的文件格式存储，这种格式是专门为存储向量和多维矩阵设计的。最后一节介绍了这种格式（IDX格式）。
- 文件中的所有整数都采用MSB优先（高字节序）格式存储，这是大多数非Intel处理器使用的格式。使用Intel处理器和其他低字节序机器的用户必须翻转头部的字节。

共有 4 个文件：

```plaintext
train-images-idx3-ubyte: training set images  
train-labels-idx1-ubyte: training set labels  
t10k-images-idx3-ubyte:  test set images  
t10k-labels-idx1-ubyte:  test set labels
```

训练集有60000个样本，测试集有10000个样本。测试集的前5000个样本来自原始的NIST训练集，后5000个来自原始的NIST测试集。前5000个比后5000个更干净、更简单。

## 训练集格式

```plaintext
### TRAINING SET LABEL FILE (train-labels-idx1-ubyte):

[offset] [type]          [value]          [description]  
0000     32 bit integer  0x00000801(2049) magic number (MSB first)  
0004     32 bit integer  60000            number of items  
0008     unsigned byte   ??               label  
0009     unsigned byte   ??               label  
........  
xxxx     unsigned byte   ??               label

The labels values are 0 to 9.
```

```plaintext
### TRAINING SET IMAGE FILE (train-images-idx3-ubyte):

[offset] [type]          [value]          [description]  
0000     32 bit integer  0x00000803(2051) magic number  
0004     32 bit integer  60000            number of images  
0008     32 bit integer  28               number of rows  
0012     32 bit integer  28               number of columns  
0016     unsigned byte   ??               pixel  
0017     unsigned byte   ??               pixel  
........  
xxxx     unsigned byte   ??               pixel
```

Pixels are organized row-wise. Pixel values are 0 to 255. 0 means background (white), 255 means foreground (black).

## 测试集格式

```plaintext
### TEST SET LABEL FILE (t10k-labels-idx1-ubyte):

[offset] [type]          [value]          [description]  
0000     32 bit integer  0x00000801(2049) magic number (MSB first)  
0004     32 bit integer  10000            number of items  
0008     unsigned byte   ??               label  
0009     unsigned byte   ??               label  
........  
xxxx     unsigned byte   ??               label

The labels values are 0 to 9.
```

```plaintext
### TEST SET IMAGE FILE (t10k-images-idx3-ubyte):

[offset] [type]          [value]          [description]  
0000     32 bit integer  0x00000803(2051) magic number  
0004     32 bit integer  10000            number of images  
0008     32 bit integer  28               number of rows  
0012     32 bit integer  28               number of columns  
0016     unsigned byte   ??               pixel  
0017     unsigned byte   ??               pixel  
........  
xxxx     unsigned byte   ??               pixel
```

Pixels are organized row-wise. Pixel values are 0 to 255. 0 means background (white), 255 means foreground (black).

## IDX格式

IDX 文件格式是一种简单的格式，用来存储各种数值类型的向量和多维矩阵。

其基础格式如下：

```plaintext
magic number  
size in dimension 0  
size in dimension 1  
size in dimension 2  
.....  
size in dimension N  
data
```

`magic number` 是一个整数（高位字节在前）。前两个字节总是0。

第三个字节编码如下数据：

```plaintext
0x08: unsigned byte  
0x09: signed byte  
0x0B: short (2 bytes)  
0x0C: int (4 bytes)  
0x0D: float (4 bytes)  
0x0E: double (8 bytes)
```

- 第4个字节表示向量/矩阵的维数：1表示向量，2表示矩阵……
- 每一维的大小都是4字节整数（最高有效字节在前，大端序，就像大多数非Intel处理器那样）。
- 数据的存储方式和C数组一样，也就是说，最后一维的下标变化得最快。